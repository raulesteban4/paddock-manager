package com.paddock.manager.modules.part.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Métricas y estadísticas globales del almacén de repuestos")
public class InventoryStatsDto {

    @Schema(description = "Total de referencias activas en catálogo")
    private long totalParts;

    @Schema(description = "Número de piezas con existencias en o por debajo del umbral mínimo")
    private long lowStockCount;

    @Schema(description = "Valoración total del stock a precio de coste (€)")
    private BigDecimal totalCostValue;

    @Schema(description = "Valoración total del stock a precio de venta (€)")
    private BigDecimal totalRetailValue;
}

