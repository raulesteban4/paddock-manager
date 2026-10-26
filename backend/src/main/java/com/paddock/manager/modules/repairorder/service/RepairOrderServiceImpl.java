package com.paddock.manager.modules.repairorder.service;

import com.paddock.manager.common.exception.BusinessException;
import com.paddock.manager.common.exception.ResourceNotFoundException;
import com.paddock.manager.modules.customer.entity.Customer;
import com.paddock.manager.modules.customer.repository.CustomerRepository;
import com.paddock.manager.modules.repairorder.dto.RepairOrderRequestDto;
import com.paddock.manager.modules.repairorder.dto.RepairOrderResponseDto;
import com.paddock.manager.modules.repairorder.dto.StatusChangeRequestDto;
import com.paddock.manager.modules.repairorder.entity.RepairOrder;
import com.paddock.manager.modules.repairorder.entity.RepairOrderPriority;
import com.paddock.manager.modules.repairorder.entity.RepairOrderStatus;
import com.paddock.manager.modules.repairorder.entity.StatusHistory;
import com.paddock.manager.modules.repairorder.mapper.RepairOrderMapper;
import com.paddock.manager.modules.repairorder.repository.RepairOrderRepository;
import com.paddock.manager.modules.repairorder.repository.StatusHistoryRepository;
import com.paddock.manager.modules.user.entity.User;
import com.paddock.manager.modules.user.repository.UserRepository;
import com.paddock.manager.modules.vehicle.entity.Vehicle;
import com.paddock.manager.modules.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RepairOrderServiceImpl implements RepairOrderService {

    private final RepairOrderRepository repairOrderRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final RepairOrderMapper mapper;

    @Override
    public Page<RepairOrderResponseDto> findAll(
            RepairOrderStatus status,
            RepairOrderPriority priority,
            Long customerId,
            Long vehicleId,
            Long mechanicId,
            String search,
            Pageable pageable) {

        return repairOrderRepository.findAllWithFilters(
                status, priority, customerId, vehicleId, mechanicId, search, pageable
        ).map(order -> {
            List<StatusHistory> history = statusHistoryRepository.findByRepairOrderIdOrderByChangedAtAsc(order.getId());
            return mapper.toResponseDto(order, history);
        });
    }

    @Override
    public RepairOrderResponseDto findById(Long id) {
        RepairOrder order = findOrderOrThrow(id);
        List<StatusHistory> history = statusHistoryRepository.findByRepairOrderIdOrderByChangedAtAsc(id);
        return mapper.toResponseDto(order, history);
    }

    @Override
    public RepairOrderResponseDto findByOrderNumber(String orderNumber) {
        RepairOrder order = repairOrderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Orden de Reparación", "orderNumber", orderNumber));
        List<StatusHistory> history = statusHistoryRepository.findByRepairOrderIdOrderByChangedAtAsc(order.getId());
        return mapper.toResponseDto(order, history);
    }

    @Override
    @Transactional
    public RepairOrderResponseDto create(RepairOrderRequestDto request) {
        log.info("Creando nueva orden de reparación para cliente ID: {} y vehículo ID: {}",
                request.getCustomerId(), request.getVehicleId());

        Customer customer = findCustomerOrThrow(request.getCustomerId());
        Vehicle vehicle = findVehicleOrThrow(request.getVehicleId());

        validateVehicleBelongsToCustomer(vehicle, customer);

        User mechanic = null;
        if (request.getMechanicId() != null) {
            mechanic = findAndValidateMechanic(request.getMechanicId());
        }

        // Actualizar kilometraje del vehículo si el ingresado es mayor
        if (request.getMileageAtEntry() > vehicle.getMileage()) {
            vehicle.setMileage(request.getMileageAtEntry());
            vehicleRepository.save(vehicle);
        }

        String orderNumber = generateNextOrderNumber();
        ZonedDateTime entryDate = request.getEntryDate() != null ? request.getEntryDate() : ZonedDateTime.now();

        RepairOrder order = RepairOrder.builder()
                .orderNumber(orderNumber)
                .customer(customer)
                .vehicle(vehicle)
                .mechanic(mechanic)
                .entryDate(entryDate)
                .estimatedDeliveryDate(request.getEstimatedDeliveryDate())
                .mileageAtEntry(request.getMileageAtEntry())
                .customerIssue(request.getCustomerIssue())
                .observations(request.getObservations())
                .priority(request.getPriority() != null ? request.getPriority() : RepairOrderPriority.MEDIUM)
                .status(RepairOrderStatus.RECEIVED)
                .build();

        RepairOrder saved = repairOrderRepository.save(order);

        // Registro inicial en el historial
        StatusHistory initialHistory = StatusHistory.builder()
                .repairOrder(saved)
                .previousStatus(null)
                .newStatus(RepairOrderStatus.RECEIVED)
                .notes("Vehículo recepcionado y orden creada en taller")
                .build();
        statusHistoryRepository.save(initialHistory);

        log.info("Orden de reparación creada con éxito: {}", saved.getOrderNumber());
        return mapper.toResponseDto(saved, List.of(initialHistory));
    }

    @Override
    @Transactional
    public RepairOrderResponseDto update(Long id, RepairOrderRequestDto request) {
        log.info("Actualizando orden de reparación ID: {}", id);
        RepairOrder order = findOrderOrThrow(id);

        if (order.getStatus() == RepairOrderStatus.DELIVERED || order.getStatus() == RepairOrderStatus.CANCELLED) {
            throw new BusinessException("No se puede editar una orden en estado " + order.getStatus());
        }

        Customer customer = findCustomerOrThrow(request.getCustomerId());
        Vehicle vehicle = findVehicleOrThrow(request.getVehicleId());

        validateVehicleBelongsToCustomer(vehicle, customer);

        User mechanic = null;
        if (request.getMechanicId() != null) {
            mechanic = findAndValidateMechanic(request.getMechanicId());
        }

        if (request.getMileageAtEntry() > vehicle.getMileage()) {
            vehicle.setMileage(request.getMileageAtEntry());
            vehicleRepository.save(vehicle);
        }

        order.setCustomer(customer);
        order.setVehicle(vehicle);
        order.setMechanic(mechanic);
        if (request.getEntryDate() != null) order.setEntryDate(request.getEntryDate());
        order.setEstimatedDeliveryDate(request.getEstimatedDeliveryDate());
        order.setMileageAtEntry(request.getMileageAtEntry());
        order.setCustomerIssue(request.getCustomerIssue());
        order.setObservations(request.getObservations());
        if (request.getPriority() != null) order.setPriority(request.getPriority());

        RepairOrder updated = repairOrderRepository.save(order);
        List<StatusHistory> history = statusHistoryRepository.findByRepairOrderIdOrderByChangedAtAsc(id);
        return mapper.toResponseDto(updated, history);
    }

    @Override
    @Transactional
    public RepairOrderResponseDto changeStatus(Long id, StatusChangeRequestDto request, String userEmail) {
        log.info("Cambiando estado de orden ID: {} a {}", id, request.getNewStatus());
        RepairOrder order = findOrderOrThrow(id);

        RepairOrderStatus current = order.getStatus();
        RepairOrderStatus next = request.getNewStatus();

        validateStatusTransition(current, next);

        User changedBy = null;
        if (userEmail != null && !userEmail.isBlank()) {
            changedBy = userRepository.findByEmail(userEmail).orElse(null);
        }

        order.setStatus(next);
        RepairOrder updated = repairOrderRepository.save(order);

        StatusHistory history = StatusHistory.builder()
                .repairOrder(updated)
                .previousStatus(current)
                .newStatus(next)
                .changedBy(changedBy)
                .notes(request.getNotes())
                .build();
        statusHistoryRepository.save(history);

        List<StatusHistory> allHistory = statusHistoryRepository.findByRepairOrderIdOrderByChangedAtAsc(id);
        return mapper.toResponseDto(updated, allHistory);
    }

    @Override
    @Transactional
    public RepairOrderResponseDto assignMechanic(Long id, Long mechanicId) {
        log.info("Asignando mecánico ID: {} a la orden ID: {}", mechanicId, id);
        RepairOrder order = findOrderOrThrow(id);

        User mechanic = null;
        if (mechanicId != null) {
            mechanic = findAndValidateMechanic(mechanicId);
        }

        order.setMechanic(mechanic);
        RepairOrder updated = repairOrderRepository.save(order);

        List<StatusHistory> history = statusHistoryRepository.findByRepairOrderIdOrderByChangedAtAsc(id);
        return mapper.toResponseDto(updated, history);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info("Eliminando orden de reparación ID: {}", id);
        RepairOrder order = findOrderOrThrow(id);

        if (order.getStatus() != RepairOrderStatus.RECEIVED && order.getStatus() != RepairOrderStatus.CANCELLED) {
            throw new BusinessException(
                    "Solo se pueden eliminar órdenes en estado RECEIVED o CANCELLED. "
                    + "Para órdenes en curso, cancélalas primero.");
        }

        statusHistoryRepository.deleteByRepairOrderId(id);
        repairOrderRepository.delete(order);
        log.info("Orden ID: {} eliminada correctamente", id);
    }

    // ─── Helpers Privados ─────────────────────────────────────

    private RepairOrder findOrderOrThrow(Long id) {
        return repairOrderRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Orden de Reparación", "id", id));
    }

    private Customer findCustomerOrThrow(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", id));
    }

    private Vehicle findVehicleOrThrow(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", "id", id));
    }

    private User findAndValidateMechanic(Long mechanicId) {
        User mechanic = userRepository.findById(mechanicId)
                .orElseThrow(() -> new ResourceNotFoundException("Mecánico", "id", mechanicId));

        String role = mechanic.getRole().getName();
        if (!"ROLE_MECHANIC".equals(role) && !"ROLE_ADMIN".equals(role)) {
            throw new BusinessException("El usuario seleccionado (" + mechanic.getFullName() + ") no tiene rol de mecánico.");
        }
        return mechanic;
    }

    private void validateVehicleBelongsToCustomer(Vehicle vehicle, Customer customer) {
        if (!vehicle.getCustomer().getId().equals(customer.getId())) {
            throw new BusinessException("El vehículo con matrícula '" + vehicle.getLicensePlate() +
                    "' no pertenece al cliente seleccionado.");
        }
    }

    private synchronized String generateNextOrderNumber() {
        int year = LocalDate.now().getYear();
        String prefix = String.format("ORD-%d-", year);

        return repairOrderRepository.findLastOrderNumberWithPrefix(prefix)
                .map(last -> {
                    try {
                        String seqStr = last.substring(prefix.length());
                        int nextSeq = Integer.parseInt(seqStr) + 1;
                        return String.format("%s%04d", prefix, nextSeq);
                    } catch (Exception e) {
                        return prefix + "0001";
                    }
                })
                .orElse(prefix + "0001");
    }

    private void validateStatusTransition(RepairOrderStatus current, RepairOrderStatus next) {
        if (current == next) {
            throw new BusinessException("La orden ya se encuentra en estado " + next);
        }

        boolean valid = switch (current) {
            case RECEIVED -> next == RepairOrderStatus.DIAGNOSIS || next == RepairOrderStatus.CANCELLED;
            case DIAGNOSIS -> next == RepairOrderStatus.QUOTE_PENDING || next == RepairOrderStatus.IN_REPAIR || next == RepairOrderStatus.CANCELLED;
            case QUOTE_PENDING -> next == RepairOrderStatus.APPROVED || next == RepairOrderStatus.CANCELLED;
            case APPROVED -> next == RepairOrderStatus.IN_REPAIR || next == RepairOrderStatus.WAITING_FOR_PARTS || next == RepairOrderStatus.CANCELLED;
            case IN_REPAIR -> next == RepairOrderStatus.WAITING_FOR_PARTS || next == RepairOrderStatus.COMPLETED || next == RepairOrderStatus.CANCELLED;
            case WAITING_FOR_PARTS -> next == RepairOrderStatus.IN_REPAIR || next == RepairOrderStatus.CANCELLED;
            case COMPLETED -> next == RepairOrderStatus.DELIVERED;
            case DELIVERED -> false;
            case CANCELLED -> false;
        };

        if (!valid) {
            throw new BusinessException(
                    String.format("Transición no permitida: %s -> %s. Sigue el flujo operativo del taller.", current, next));
        }
    }
}

