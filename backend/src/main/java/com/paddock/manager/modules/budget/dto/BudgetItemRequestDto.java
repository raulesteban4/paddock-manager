package com.paddock.manager.modules.budget.dto;

import com.paddock.manager.modules.budget.entity.BudgetItemType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos para una línea o concepto del presupuesto")
public class BudgetItemRequestDto {

    @NotNull(message = "El tipo de concepto es obligatorio (LABOR, PART, DIAGNOSIS, OTHER)")
    @Schema(description = "Tipo de concepto", example = "LABOR")
    private BudgetItemType itemType;

    @NotBlank(message = "La descripción de la línea es obligatoria")
    @Size(min = 2, max = 255, message = "La descripción debe tener entre 2 y 255 caracteres")
    @Schema(description = "Descripción del trabajo, pieza o servicio", example = "Mano de obra - Sustitución de pastillas de freno")
    private String description;

    @NotNull(message = "La cantidad es obligatoria")
    @DecimalMin(value = "0.01", message = "La cantidad mínima debe ser 0.01")
    @Schema(description = "Cantidad o número de horas", example = "2.0")
    private BigDecimal quantity;

    @NotNull(message = "El precio unitario es obligatorio")
    @DecimalMin(value = "0.00", message = "El precio unitario no puede ser negativo")
    @Schema(description = "Precio unitario sin IVA", example = "45.00")
    private BigDecimal unitPrice;
}

