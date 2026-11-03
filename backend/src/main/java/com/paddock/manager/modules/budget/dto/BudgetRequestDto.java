package com.paddock.manager.modules.budget.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos de entrada para emitir o actualizar un Presupuesto")
public class BudgetRequestDto {

    @NotNull(message = "El ID de la orden de reparación es obligatorio")
    @Schema(description = "ID de la orden de reparación asociada", example = "1")
    private Long repairOrderId;

    @DecimalMin(value = "0.00", message = "El porcentaje de IVA no puede ser negativo")
    @Schema(description = "Porcentaje de IVA aplicable (por defecto 21.00%)", example = "21.00")
    private BigDecimal taxRate;

    @Schema(description = "Observaciones o notas informativas para el cliente", example = "Presupuesto válido durante 15 días naturales")
    private String customerNotes;

    @NotEmpty(message = "El presupuesto debe incluir al menos una línea o concepto")
    @Valid
    @Schema(description = "Lista de líneas de trabajo, recambios o diagnósticos")
    private List<BudgetItemRequestDto> items;
}

