package com.paddock.manager.modules.appointment.dto;

import com.paddock.manager.modules.appointment.entity.AppointmentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.ZonedDateTime;

/**
 * DTO de entrada para crear o actualizar una cita.
 * Todas las validaciones se realizan aquí antes de llegar al servicio.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos para crear o actualizar una cita en el taller")
public class AppointmentRequestDto {

    @NotNull(message = "El ID del cliente es obligatorio")
    @Positive(message = "El ID del cliente debe ser un número positivo")
    @Schema(description = "ID del cliente que solicita la cita", example = "1")
    private Long customerId;

    @NotNull(message = "El ID del vehículo es obligatorio")
    @Positive(message = "El ID del vehículo debe ser un número positivo")
    @Schema(description = "ID del vehículo para el que se solicita la cita", example = "1")
    private Long vehicleId;

    @NotNull(message = "La fecha y hora de la cita son obligatorias")
    @Future(message = "La cita debe programarse en el futuro")
    @Schema(description = "Fecha y hora de la cita (ISO 8601 con zona)", example = "2026-11-15T10:00:00+01:00")
    private ZonedDateTime appointmentDateTime;

    @NotBlank(message = "El motivo de la cita es obligatorio")
    @Size(min = 5, max = 255, message = "El motivo debe tener entre 5 y 255 caracteres")
    @Schema(description = "Motivo principal de la cita", example = "Revisión de frenos y cambio de aceite")
    private String reason;

    @Size(max = 1000, message = "Las observaciones no pueden superar los 1000 caracteres")
    @Schema(description = "Observaciones adicionales del cliente", example = "El cliente menciona ruido metálico al frenar")
    private String observations;

    @Schema(description = "Estado de la cita (sólo para actualizaciones)", example = "CONFIRMADA")
    private AppointmentStatus status;
}

