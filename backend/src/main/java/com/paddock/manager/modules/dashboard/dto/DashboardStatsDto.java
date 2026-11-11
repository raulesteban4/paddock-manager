package com.paddock.manager.modules.dashboard.dto;

import com.paddock.manager.modules.repairorder.dto.RepairOrderResponseDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Métricas consolidadas y KPIs del taller en tiempo real")
public class DashboardStatsDto {

    @Schema(description = "Número de vehículos distintos actualmente en instalaciones del taller", example = "12")
    private long vehiclesInWorkshop;

    @Schema(description = "Total de órdenes de trabajo activas en curso", example = "8")
    private long activeRepairOrders;

    @Schema(description = "Citas programadas para la jornada de hoy", example = "4")
    private long todayAppointments;

    @Schema(description = "Piezas con existencias en o por debajo del umbral mínimo de stock", example = "2")
    private long lowStockParts;

    @Schema(description = "Facturación total acumulada de presupuestos aprobados (€)", example = "15420.50")
    private BigDecimal totalApprovedRevenue;

    @Schema(description = "Desglose de órdenes de trabajo por estado operativo")
    private Map<String, Long> ordersByStatus;

    @Schema(description = "Listado de las órdenes de trabajo activas más recientes")
    private List<RepairOrderResponseDto> recentOrders;
}
