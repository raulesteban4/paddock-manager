package com.paddock.manager.modules.budget.dto;

import com.paddock.manager.modules.budget.entity.BudgetStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Petición para cambio de estado de un Presupuesto (aprobación / rechazo)")
public class BudgetStatusChangeDto {

    @NotNull(message = "El nuevo estado es obligatorio (APPROVED o REJECTED)")
    @Schema(description = "Nuevo estado del presupuesto", example = "APPROVED")
    private BudgetStatus newStatus;

    @Schema(description = "Notas sobre la resolución (ej. vía telefónica, presencial, motivo de rechazo)", example = "Aprobado telefónicamente por el cliente")
    private String notes;
}

