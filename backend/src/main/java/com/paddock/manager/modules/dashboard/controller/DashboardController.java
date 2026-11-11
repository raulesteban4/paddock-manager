package com.paddock.manager.modules.dashboard.controller;

import com.paddock.manager.common.response.ApiResponse;
import com.paddock.manager.modules.dashboard.dto.DashboardStatsDto;
import com.paddock.manager.modules.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Métricas consolidadas, KPIs del taller y resumen operativo en tiempo real")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    @Operation(summary = "Obtener estadísticas globales y KPIs del taller en tiempo real")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'MECHANIC')")
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getStats() {
        log.info("GET /api/dashboard/stats - Consultando KPIs del taller");
        DashboardStatsDto stats = dashboardService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Estadísticas del panel obtenidas correctamente", stats));
    }
}
