package com.paddock.manager.modules.repairorder.dto;

import com.paddock.manager.modules.repairorder.entity.RepairOrderStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO para solicitar un cambio de estado en la orden de reparación con notas opcionales.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos para realizar la transición de estado de una orden")
public class StatusChangeRequestDto {

    @NotNull(message = "El nuevo estado es obligatorio")
    @Schema(description = "Nuevo estado de la orden", example = "IN_REPAIR")
    private RepairOrderStatus newStatus;

    @Size(max = 1000, message = "Las notas no pueden exceder 1000 caracteres")
    @Schema(description = "Motivo o nota explicativa del cambio de estado", example = "Se reciben los recambios y se inicia montaje")
    private String notes;
}

