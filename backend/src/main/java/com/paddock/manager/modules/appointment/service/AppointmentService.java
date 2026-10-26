package com.paddock.manager.modules.appointment.service;

import com.paddock.manager.modules.appointment.dto.AppointmentRequestDto;
import com.paddock.manager.modules.appointment.dto.AppointmentResponseDto;
import com.paddock.manager.modules.appointment.entity.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Contrato del servicio de Citas.
 * Definimos la interfaz por separado para facilitar el testing con Mockito.
 */
public interface AppointmentService {

    /** Lista todas las citas con paginación y filtros opcionales */
    Page<AppointmentResponseDto> findAll(AppointmentStatus status, Long customerId, Long vehicleId, Pageable pageable);

    /** Obtiene una cita por su ID (lanza ResourceNotFoundException si no existe) */
    AppointmentResponseDto findById(Long id);

    /** Crea una nueva cita con validaciones de negocio */
    AppointmentResponseDto create(AppointmentRequestDto request);

    /** Actualiza los datos de una cita existente */
    AppointmentResponseDto update(Long id, AppointmentRequestDto request);

    /** Cambia el estado de una cita (cambio de estado controlado) */
    AppointmentResponseDto changeStatus(Long id, AppointmentStatus newStatus);

    /** Cancela (elimina lógicamente) una cita */
    AppointmentResponseDto cancel(Long id);

    /** Elimina una cita permanentemente (solo en estado CANCELADA o PROGRAMADA) */
    void delete(Long id);
}

