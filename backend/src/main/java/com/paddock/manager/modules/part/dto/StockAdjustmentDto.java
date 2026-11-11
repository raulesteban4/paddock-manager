package com.paddock.manager.modules.part.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos para un ajuste rápido de existencias (incremento o reducción)")
public class StockAdjustmentDto {

    @NotNull(message = "La variación de cantidad es obligatoria")
    @Schema(description = "Unidades a sumar (positivo) o restar (negativo)", example = "10")
    private Integer quantityDelta;

    @Schema(description = "Motivo del ajuste de inventario", example = "Recepción de albarán ALB-2026-042")
    private String reason;
}

