package com.paddock.manager.modules.appointment.mapper;

import com.paddock.manager.modules.appointment.dto.AppointmentResponseDto;
import com.paddock.manager.modules.appointment.entity.Appointment;
import org.springframework.stereotype.Component;

/**
 * Mapper manual de Appointment -> AppointmentResponseDto.
 * Aplanamos los datos de cliente y vehículo para que el frontend
 * no necesite hacer llamadas adicionales para mostrar las citas.
 */
@Component
public class AppointmentMapper {

    /**
     * Convierte una entidad Appointment en su DTO de respuesta.
     * Las entidades Customer y Vehicle deben estar inicializadas (no ser proxies Lazy).
     */
    public AppointmentResponseDto toResponseDto(Appointment appointment) {
        if (appointment == null) return null;

        var customer = appointment.getCustomer();
        var vehicle  = appointment.getVehicle();

        return AppointmentResponseDto.builder()
                .id(appointment.getId())
                // Datos del cliente
                .customerId(customer.getId())
                .customerName(customer.getFirstName() + " " + customer.getLastName())
                .customerPhone(customer.getPhone())
                // Datos del vehículo
                .vehicleId(vehicle.getId())
                .vehicleDescription(vehicle.getBrand() + " " + vehicle.getModel() + " (" + vehicle.getYear() + ")")
                .licensePlate(vehicle.getLicensePlate())
                // Datos de la cita
                .appointmentDateTime(appointment.getAppointmentDateTime())
                .reason(appointment.getReason())
                .observations(appointment.getObservations())
                .status(appointment.getStatus())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt())
                .build();
    }
}

