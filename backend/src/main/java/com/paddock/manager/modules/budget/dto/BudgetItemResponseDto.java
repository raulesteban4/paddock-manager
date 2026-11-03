package com.paddock.manager.modules.budget.dto;

import com.paddock.manager.modules.budget.entity.BudgetItemType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos de respuesta de una línea de presupuesto")
public class BudgetItemResponseDto {

    private Long id;
    private BudgetItemType itemType;
    private String description;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal total;
}

