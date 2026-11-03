package com.paddock.manager.modules.diagnosis.service;

import com.paddock.manager.common.exception.BusinessException;
import com.paddock.manager.common.exception.ResourceNotFoundException;
import com.paddock.manager.modules.diagnosis.dto.DiagnosisRequestDto;
import com.paddock.manager.modules.diagnosis.dto.DiagnosisResponseDto;
import com.paddock.manager.modules.diagnosis.entity.Diagnosis;
import com.paddock.manager.modules.diagnosis.mapper.DiagnosisMapper;
import com.paddock.manager.modules.diagnosis.repository.DiagnosisRepository;
import com.paddock.manager.modules.repairorder.entity.RepairOrder;
import com.paddock.manager.modules.repairorder.entity.RepairOrderStatus;
import com.paddock.manager.modules.repairorder.repository.RepairOrderRepository;
import com.paddock.manager.modules.user.entity.User;
import com.paddock.manager.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

/**
 * Implementación del servicio de Diagnósticos Técnicos.
 *
 * Reglas de negocio:
 *  - Solo se puede crear diagnóstico si la OR está en estado DIAGNOSIS, QUOTE_PENDING o APPROVED.
 *  - Solo puede existir un diagnóstico por orden de reparación.
 *  - Solo se puede actualizar si la OR no está en DELIVERED ni CANCELLED.
 *  - Solo se puede eliminar si la OR está en DIAGNOSIS o QUOTE_PENDING.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiagnosisServiceImpl implements DiagnosisService {

    private static final Set<RepairOrderStatus> ALLOWED_CREATE_STATUSES = Set.of(
            RepairOrderStatus.DIAGNOSIS,
            RepairOrderStatus.QUOTE_PENDING,
            RepairOrderStatus.APPROVED
    );

    private static final Set<RepairOrderStatus> BLOCKED_UPDATE_STATUSES = Set.of(
            RepairOrderStatus.DELIVERED,
            RepairOrderStatus.CANCELLED
    );

    private static final Set<RepairOrderStatus> ALLOWED_DELETE_STATUSES = Set.of(
            RepairOrderStatus.DIAGNOSIS,
            RepairOrderStatus.QUOTE_PENDING
    );

    private final DiagnosisRepository diagnosisRepository;
    private final RepairOrderRepository repairOrderRepository;
    private final UserRepository userRepository;
    private final DiagnosisMapper diagnosisMapper;

    @Override
    @Transactional
    public DiagnosisResponseDto create(DiagnosisRequestDto dto) {
        log.info("Creando diagnóstico para orden ID: {}", dto.getRepairOrderId());

        RepairOrder repairOrder = repairOrderRepository.findById(dto.getRepairOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Orden de reparación", "id", dto.getRepairOrderId()));

        // Regla: la OR debe estar en estado que permita diagnóstico
        if (!ALLOWED_CREATE_STATUSES.contains(repairOrder.getStatus())) {
            throw new BusinessException(
                    "No se puede registrar un diagnóstico para una orden en estado: " + repairOrder.getStatus()
                    + ". Estado requerido: DIAGNOSIS, QUOTE_PENDING o APPROVED.");
        }

        // Regla: solo un diagnóstico por orden
        if (diagnosisRepository.existsByRepairOrderId(dto.getRepairOrderId())) {
            throw new BusinessException(
                    "Ya existe un diagnóstico para la orden " + repairOrder.getOrderNumber()
                    + ". Usa la función de actualización para modificarlo.");
        }

        // Mecánico: usa el indicado en el DTO, o el mecánico asignado a la OR, o lanza error
        User mechanic = resolveMechanic(dto.getMechanicId(), repairOrder);

        Diagnosis diagnosis = Diagnosis.builder()
                .repairOrder(repairOrder)
                .mechanic(mechanic)
                .symptoms(dto.getSymptoms())
                .diagnosis(dto.getDiagnosis())
                .recommendations(dto.getRecommendations())
                .observations(dto.getObservations())
                .build();

        Diagnosis saved = diagnosisRepository.save(diagnosis);
        log.info("Diagnóstico creado con ID: {} para orden: {}", saved.getId(), repairOrder.getOrderNumber());
        return diagnosisMapper.toResponseDto(saved);
    }

    @Override
    @Transactional
    public DiagnosisResponseDto update(Long id, DiagnosisRequestDto dto) {
        log.info("Actualizando diagnóstico ID: {}", id);

        Diagnosis diagnosis = diagnosisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Diagnóstico", "id", id));

        RepairOrder repairOrder = diagnosis.getRepairOrder();

        // Regla: no se puede editar si la OR está cerrada
        if (BLOCKED_UPDATE_STATUSES.contains(repairOrder.getStatus())) {
            throw new BusinessException(
                    "No se puede modificar el diagnóstico de una orden en estado: " + repairOrder.getStatus());
        }

        User mechanic = resolveMechanic(dto.getMechanicId(), repairOrder);

        diagnosis.setMechanic(mechanic);
        diagnosis.setSymptoms(dto.getSymptoms());
        diagnosis.setDiagnosis(dto.getDiagnosis());
        diagnosis.setRecommendations(dto.getRecommendations());
        diagnosis.setObservations(dto.getObservations());

        Diagnosis saved = diagnosisRepository.save(diagnosis);
        log.info("Diagnóstico ID: {} actualizado", saved.getId());
        return diagnosisMapper.toResponseDto(saved);
    }

    @Override
    public DiagnosisResponseDto getByRepairOrderId(Long repairOrderId) {
        Diagnosis diagnosis = diagnosisRepository.findByRepairOrderId(repairOrderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Diagnóstico", "repairOrderId", repairOrderId));
        return diagnosisMapper.toResponseDto(diagnosis);
    }

    @Override
    public DiagnosisResponseDto getByOrderNumber(String orderNumber) {
        Diagnosis diagnosis = diagnosisRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Diagnóstico", "orderNumber", orderNumber));
        return diagnosisMapper.toResponseDto(diagnosis);
    }

    @Override
    public DiagnosisResponseDto getById(Long id) {
        Diagnosis diagnosis = diagnosisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Diagnóstico", "id", id));
        return diagnosisMapper.toResponseDto(diagnosis);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info("Eliminando diagnóstico ID: {}", id);

        Diagnosis diagnosis = diagnosisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Diagnóstico", "id", id));

        RepairOrder repairOrder = diagnosis.getRepairOrder();

        if (!ALLOWED_DELETE_STATUSES.contains(repairOrder.getStatus())) {
            throw new BusinessException(
                    "No se puede eliminar el diagnóstico de una orden en estado: " + repairOrder.getStatus()
                    + ". Solo se permite en estado DIAGNOSIS o QUOTE_PENDING.");
        }

        diagnosisRepository.delete(diagnosis);
        log.info("Diagnóstico ID: {} eliminado de la orden: {}", id, repairOrder.getOrderNumber());
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    /**
     * Resuelve el mecánico a asignar: usa el indicado en el DTO, luego el de la OR, o lanza excepción.
     */
    private User resolveMechanic(Long mechanicId, RepairOrder repairOrder) {
        if (mechanicId != null) {
            return userRepository.findById(mechanicId)
                    .orElseThrow(() -> new ResourceNotFoundException("Mecánico", "id", mechanicId));
        }
        if (repairOrder.getMechanic() != null) {
            return repairOrder.getMechanic();
        }
        throw new BusinessException(
                "Debe especificar un mecánico para el diagnóstico, o asignar uno a la orden de reparación primero.");
    }
}

