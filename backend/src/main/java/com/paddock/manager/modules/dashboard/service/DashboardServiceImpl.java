package com.paddock.manager.modules.dashboard.service;

import com.paddock.manager.modules.appointment.repository.AppointmentRepository;
import com.paddock.manager.modules.budget.entity.BudgetStatus;
import com.paddock.manager.modules.budget.repository.BudgetRepository;
import com.paddock.manager.modules.dashboard.dto.DashboardStatsDto;
import com.paddock.manager.modules.part.repository.PartRepository;
import com.paddock.manager.modules.repairorder.dto.RepairOrderResponseDto;
import com.paddock.manager.modules.repairorder.entity.RepairOrder;
import com.paddock.manager.modules.repairorder.entity.RepairOrderStatus;
import com.paddock.manager.modules.repairorder.mapper.RepairOrderMapper;
import com.paddock.manager.modules.repairorder.repository.RepairOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final RepairOrderRepository repairOrderRepository;
    private final AppointmentRepository appointmentRepository;
    private final PartRepository partRepository;
    private final BudgetRepository budgetRepository;
    private final RepairOrderMapper repairOrderMapper;

    private static final List<RepairOrderStatus> EXCLUDED_STATUSES = List.of(
            RepairOrderStatus.DELIVERED,
            RepairOrderStatus.CANCELLED
    );

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats() {
        log.info("Calculando métricas globales de taller para Dashboard");

        // 1. Vehículos distintos actualmente en el taller
        long vehiclesInWorkshop = repairOrderRepository.countDistinctVehiclesByStatusNotIn(EXCLUDED_STATUSES);

        // 2. Total de órdenes de trabajo activas
        long activeOrders = repairOrderRepository.countByStatusNotIn(EXCLUDED_STATUSES);

        // 3. Citas del día actual
        ZonedDateTime now = ZonedDateTime.now(ZoneId.systemDefault());
        ZonedDateTime startOfDay = now.toLocalDate().atStartOfDay(now.getZone());
        ZonedDateTime endOfDay = startOfDay.plusDays(1).minusNanos(1);
        long todayAppointments = appointmentRepository.countAppointmentsBetween(startOfDay, endOfDay);

        // 4. Piezas bajo stock mínimo
        long lowStockParts = partRepository.countLowStock();

        // 5. Facturación total aprobada
        BigDecimal approvedRevenue = budgetRepository.sumTotalByStatus(BudgetStatus.APPROVED);

        // 6. Desglose de órdenes por estado operativo
        Map<String, Long> ordersByStatus = new LinkedHashMap<>();
        ordersByStatus.put("IN_REPAIR", repairOrderRepository.countByStatus(RepairOrderStatus.IN_REPAIR));
        ordersByStatus.put("DIAGNOSIS", repairOrderRepository.countByStatus(RepairOrderStatus.DIAGNOSIS));
        ordersByStatus.put("QUOTE_PENDING", repairOrderRepository.countByStatus(RepairOrderStatus.QUOTE_PENDING));
        ordersByStatus.put("WAITING_FOR_PARTS", repairOrderRepository.countByStatus(RepairOrderStatus.WAITING_FOR_PARTS));
        ordersByStatus.put("RECEIVED", repairOrderRepository.countByStatus(RepairOrderStatus.RECEIVED));
        ordersByStatus.put("APPROVED", repairOrderRepository.countByStatus(RepairOrderStatus.APPROVED));
        ordersByStatus.put("COMPLETED", repairOrderRepository.countByStatus(RepairOrderStatus.COMPLETED));

        // 7. Órdenes activas más recientes (top 5)
        List<RepairOrder> recentOrderEntities = repairOrderRepository.findRecentActiveOrders(
                EXCLUDED_STATUSES, PageRequest.of(0, 5)
        );
        List<RepairOrderResponseDto> recentOrders = recentOrderEntities.stream()
                .map(repairOrderMapper::toResponseDto)
                .toList();

        return DashboardStatsDto.builder()
                .vehiclesInWorkshop(vehiclesInWorkshop)
                .activeRepairOrders(activeOrders)
                .todayAppointments(todayAppointments)
                .lowStockParts(lowStockParts)
                .totalApprovedRevenue(approvedRevenue != null ? approvedRevenue : BigDecimal.ZERO)
                .ordersByStatus(ordersByStatus)
                .recentOrders(recentOrders)
                .build();
    }
}
