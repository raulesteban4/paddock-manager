package com.paddock.manager.modules.diagnosis.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos de entrada para creación y actualización de un Diagnóstico Técnico")
public class DiagnosisRequestDto {

    @NotNull(message = "El ID de la orden de reparación es obligatorio")
    @Schema(description = "ID de la orden de reparación asociada", example = "1")
    private Long repairOrderId;

    @Schema(description = "ID del mecánico responsable. Si no se indica, se asignará el mecánico de la orden o el usuario actual", example = "3")
    private Long mechanicId;

    @NotBlank(message = "Los síntomas reportados y observados son obligatorios")
    @Size(min = 5, message = "Los síntomas deben tener al menos 5 caracteres")
    @Schema(description = "Síntomas percibidos por el cliente o detectados en la recepción", example = "Ruido metálico al pisar el pedal de freno")
    private String symptoms;

    @NotBlank(message = "El diagnóstico técnico es obligatorio")
    @Size(min = 5, message = "El diagnóstico debe tener al menos 5 caracteres")
    @Schema(description = "Diagnóstico técnico detallado de la avería", example = "Pastillas de freno delanteras al 10% de vida útil")
    private String diagnosis;

    @Schema(description = "Recomendaciones de reparación o sustitución de piezas", example = "Sustituir pastillas y rectificar discos si fuera necesario")
    private String recommendations;

    @Schema(description = "Observaciones adicionales sobre el estado del vehículo", example = "Discos de freno en buen estado")
    private String observations;
}

