package com.paddock.manager.modules.appointment.dto;

import com.paddock.manager.modules.appointment.entity.AppointmentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;

/**
 * DTO de salida para las respuestas de la API de citas.
 * Incluye información resumida del cliente y vehículo para evitar llamadas adicionales.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos de respuesta de una cita del taller")
public class AppointmentResponseDto {

    @Schema(description = "ID único de la cita", example = "1")
    private Long id;

    // ─── Cliente (datos resumidos) ────────────────────────────
    @Schema(description = "ID del cliente", example = "1")
    private Long customerId;

    @Schema(description = "Nombre completo del cliente", example = "Juan Pérez López")
    private String customerName;

    @Schema(description = "Teléfono del cliente", example = "611223344")
    private String customerPhone;

    // ─── Vehículo (datos resumidos) ───────────────────────────
    @Schema(description = "ID del vehículo", example = "1")
    private Long vehicleId;

    @Schema(description = "Descripción del vehículo", example = "Volkswagen Golf 2.0 TDI (2020)")
    private String vehicleDescription;

    @Schema(description = "Matrícula del vehículo", example = "1234ABC")
    private String licensePlate;

    // ─── Datos de la Cita ────────────────────────────────────
    @Schema(description = "Fecha y hora de la cita")
    private ZonedDateTime appointmentDateTime;

    @Schema(description = "Motivo de la cita", example = "Revisión de frenos")
    private String reason;

    @Schema(description = "Observaciones del cliente")
    private String observations;

    @Schema(description = "Estado actual de la cita", example = "PROGRAMADA")
    private AppointmentStatus status;

    @Schema(description = "Fecha de creación del registro")
    private LocalDateTime createdAt;

    @Schema(description = "Fecha de última modificación")
    private LocalDateTime updatedAt;
}

