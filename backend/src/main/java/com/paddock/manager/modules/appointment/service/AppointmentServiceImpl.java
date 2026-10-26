package com.paddock.manager.modules.appointment.service;

import com.paddock.manager.common.exception.BadRequestException;
import com.paddock.manager.common.exception.BusinessException;
import com.paddock.manager.common.exception.ResourceNotFoundException;
import com.paddock.manager.modules.appointment.dto.AppointmentRequestDto;
import com.paddock.manager.modules.appointment.dto.AppointmentResponseDto;
import com.paddock.manager.modules.appointment.entity.Appointment;
import com.paddock.manager.modules.appointment.entity.AppointmentStatus;
import com.paddock.manager.modules.appointment.mapper.AppointmentMapper;
import com.paddock.manager.modules.appointment.repository.AppointmentRepository;
import com.paddock.manager.modules.customer.entity.Customer;
import com.paddock.manager.modules.customer.repository.CustomerRepository;
import com.paddock.manager.modules.vehicle.entity.Vehicle;
import com.paddock.manager.modules.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;

/**
 * Implementación del servicio de Citas.
 *
 * Reglas de negocio implementadas:
 *  1. El vehículo debe pertenecer al cliente indicado.
 *  2. No se puede agendar si el vehículo ya tiene otra cita activa en la misma franja horaria (±1h).
 *  3. Solo se pueden eliminar citas en estado PROGRAMADA o CANCELADA.
 *  4. Los cambios de estado siguen una máquina de estados definida.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final AppointmentMapper mapper;

    // ─── Consultas ────────────────────────────────────────────

    @Override
    public Page<AppointmentResponseDto> findAll(
            AppointmentStatus status, Long customerId, Long vehicleId, Pageable pageable) {
        log.debug("Consultando citas - status={}, customerId={}, vehicleId={}", status, customerId, vehicleId);
        return appointmentRepository.findAllWithFilters(status, customerId, vehicleId, pageable)
                .map(mapper::toResponseDto);
    }

    @Override
    public AppointmentResponseDto findById(Long id) {
        Appointment appointment = findAppointmentOrThrow(id);
        return mapper.toResponseDto(appointment);
    }

    // ─── Creación ─────────────────────────────────────────────

    @Override
    @Transactional
    public AppointmentResponseDto create(AppointmentRequestDto request) {
        log.info("Creando nueva cita para cliente ID: {} y vehículo ID: {}",
                request.getCustomerId(), request.getVehicleId());

        Customer customer = findCustomerOrThrow(request.getCustomerId());
        Vehicle vehicle   = findVehicleOrThrow(request.getVehicleId());

        // Regla 1: el vehículo debe pertenecer al cliente
        validateVehicleBelongsToCustomer(vehicle, customer);

        // Regla 2: no debe haber conflicto de horario para ese vehículo
        validateNoScheduleConflict(request.getVehicleId(), request, null);

        Appointment appointment = Appointment.builder()
                .customer(customer)
                .vehicle(vehicle)
                .appointmentDateTime(request.getAppointmentDateTime())
                .reason(request.getReason())
                .observations(request.getObservations())
                .status(AppointmentStatus.PROGRAMADA)
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        log.info("Cita creada exitosamente con ID: {}", saved.getId());
        return mapper.toResponseDto(saved);
    }

    // ─── Actualización ────────────────────────────────────────

    @Override
    @Transactional
    public AppointmentResponseDto update(Long id, AppointmentRequestDto request) {
        log.info("Actualizando cita ID: {}", id);
        Appointment appointment = findAppointmentOrThrow(id);

        // No se pueden modificar citas finalizadas
        if (appointment.getStatus() == AppointmentStatus.COMPLETADA
                || appointment.getStatus() == AppointmentStatus.CANCELADA) {
            throw new BusinessException("No se puede modificar una cita en estado " + appointment.getStatus());
        }

        Customer customer = findCustomerOrThrow(request.getCustomerId());
        Vehicle vehicle   = findVehicleOrThrow(request.getVehicleId());

        validateVehicleBelongsToCustomer(vehicle, customer);
        validateNoScheduleConflict(request.getVehicleId(), request, id);

        appointment.setCustomer(customer);
        appointment.setVehicle(vehicle);
        appointment.setAppointmentDateTime(request.getAppointmentDateTime());
        appointment.setReason(request.getReason());
        appointment.setObservations(request.getObservations());

        // Solo actualizar status si se envió explícitamente en la request
        if (request.getStatus() != null) {
            appointment.setStatus(request.getStatus());
        }

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Cita ID: {} actualizada exitosamente", id);
        return mapper.toResponseDto(updated);
    }

    // ─── Cambio de Estado ─────────────────────────────────────

    @Override
    @Transactional
    public AppointmentResponseDto changeStatus(Long id, AppointmentStatus newStatus) {
        log.info("Cambiando estado de cita ID: {} a {}", id, newStatus);
        Appointment appointment = findAppointmentOrThrow(id);

        validateStatusTransition(appointment.getStatus(), newStatus);
        appointment.setStatus(newStatus);

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Estado de cita ID: {} cambiado a {}", id, newStatus);
        return mapper.toResponseDto(updated);
    }

    // ─── Cancelación ──────────────────────────────────────────

    @Override
    @Transactional
    public AppointmentResponseDto cancel(Long id) {
        log.info("Cancelando cita ID: {}", id);
        Appointment appointment = findAppointmentOrThrow(id);

        if (appointment.getStatus() == AppointmentStatus.COMPLETADA) {
            throw new BusinessException("No se puede cancelar una cita ya completada");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELADA) {
            throw new BusinessException("La cita ya está cancelada");
        }

        appointment.setStatus(AppointmentStatus.CANCELADA);
        Appointment cancelled = appointmentRepository.save(appointment);
        log.info("Cita ID: {} cancelada", id);
        return mapper.toResponseDto(cancelled);
    }

    // ─── Eliminación ──────────────────────────────────────────

    @Override
    @Transactional
    public void delete(Long id) {
        log.info("Eliminando cita ID: {}", id);
        Appointment appointment = findAppointmentOrThrow(id);

        if (appointment.getStatus() == AppointmentStatus.EN_TALLER
                || appointment.getStatus() == AppointmentStatus.COMPLETADA) {
            throw new BusinessException(
                    "No se puede eliminar una cita en estado " + appointment.getStatus()
                    + ". Cancélala primero.");
        }

        appointmentRepository.delete(appointment);
        log.info("Cita ID: {} eliminada permanentemente", id);
    }

    // ─── Helpers Privados ─────────────────────────────────────

    private Appointment findAppointmentOrThrow(Long id) {
        return appointmentRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", "id", id));
    }

    private Customer findCustomerOrThrow(Long customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", customerId));
    }

    private Vehicle findVehicleOrThrow(Long vehicleId) {
        return vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", "id", vehicleId));
    }

    private void validateVehicleBelongsToCustomer(Vehicle vehicle, Customer customer) {
        if (!vehicle.getCustomer().getId().equals(customer.getId())) {
            throw new BusinessException(
                    "El vehículo con matrícula '" + vehicle.getLicensePlate()
                    + "' no pertenece al cliente con ID " + customer.getId());
        }
    }

    private void validateNoScheduleConflict(Long vehicleId, AppointmentRequestDto request, Long excludeId) {
        ZonedDateTime from = request.getAppointmentDateTime().minusHours(1);
        ZonedDateTime to = request.getAppointmentDateTime().plusHours(1);
        boolean conflict = appointmentRepository.existsConflict(vehicleId, from, to, excludeId);
        if (conflict) {
            throw new BusinessException(
                    "El vehículo ya tiene una cita activa en esa franja horaria (±1 hora). "
                    + "Por favor, elige otro horario.");
        }
    }

    /**
     * Máquina de estados de las citas.
     * PROGRAMADA → CONFIRMADA → EN_TALLER → COMPLETADA
     *             → CANCELADA (desde cualquier estado excepto COMPLETADA)
     */
    private void validateStatusTransition(AppointmentStatus current, AppointmentStatus next) {
        boolean valid = switch (current) {
            case PROGRAMADA  -> next == AppointmentStatus.CONFIRMADA || next == AppointmentStatus.CANCELADA;
            case CONFIRMADA  -> next == AppointmentStatus.EN_TALLER  || next == AppointmentStatus.CANCELADA;
            case EN_TALLER   -> next == AppointmentStatus.COMPLETADA || next == AppointmentStatus.CANCELADA;
            case COMPLETADA  -> false; // Estado final
            case CANCELADA   -> false; // Estado final
        };

        if (!valid) {
            throw new BusinessException(
                    "Transición de estado inválida: " + current + " → " + next
                    + ". Revisa el flujo permitido de citas.");
        }
    }
}

