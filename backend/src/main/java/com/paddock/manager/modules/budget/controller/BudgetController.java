package com.paddock.manager.modules.budget.controller;

import com.paddock.manager.common.response.ApiResponse;
import com.paddock.manager.modules.budget.dto.BudgetRequestDto;
import com.paddock.manager.modules.budget.dto.BudgetResponseDto;
import com.paddock.manager.modules.budget.dto.BudgetStatusChangeDto;
import com.paddock.manager.modules.budget.entity.BudgetStatus;
import com.paddock.manager.modules.budget.service.BudgetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
@Tag(name = "Presupuestos", description = "Gestión de presupuestos, partidas, cálculo de IVA y flujos de aprobación")
public class BudgetController {

    private final BudgetService budgetService;

    // ── CREATE ───────────────────────────────────────────────────────────────────

    @PostMapping
    @Operation(summary = "Generar un nuevo presupuesto para una orden de reparación")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<BudgetResponseDto>> create(
            @Valid @RequestBody BudgetRequestDto dto,
            Authentication authentication) {

        String email = (authentication != null) ? authentication.getName() : null;
        BudgetResponseDto response = budgetService.create(dto, email);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Presupuesto generado correctamente", response));
    }

    // ── READ ─────────────────────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "Listar presupuestos con filtros y paginación")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'MECHANIC')")
    public ResponseEntity<ApiResponse<Page<BudgetResponseDto>>> findAll(
            @RequestParam(required = false) BudgetStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String[] sort) {

        Sort.Direction direction = Sort.Direction.fromString(sort.length > 1 ? sort[1] : "desc");
        String property = sort[0];
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, property));

        Page<BudgetResponseDto> result = budgetService.findAll(status, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener presupuesto por ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'MECHANIC', 'CUSTOMER')")
    public ResponseEntity<ApiResponse<BudgetResponseDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(budgetService.getById(id)));
    }

    @GetMapping("/by-order/{repairOrderId}")
    @Operation(summary = "Obtener presupuesto por ID de orden de reparación")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'MECHANIC')")
    public ResponseEntity<ApiResponse<BudgetResponseDto>> getByRepairOrderId(
            @PathVariable Long repairOrderId) {
        return ResponseEntity.ok(ApiResponse.success(budgetService.getByRepairOrderId(repairOrderId)));
    }

    @GetMapping("/by-order-number/{orderNumber}")
    @Operation(summary = "Obtener presupuesto por número de orden (ej: ORD-2026-0001)")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'MECHANIC')")
    public ResponseEntity<ApiResponse<BudgetResponseDto>> getByOrderNumber(
            @PathVariable String orderNumber) {
        return ResponseEntity.ok(ApiResponse.success(budgetService.getByOrderNumber(orderNumber)));
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar partidas o notas de un presupuesto en borrador")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<BudgetResponseDto>> update(
            @PathVariable Long id,
            @Valid @RequestBody BudgetRequestDto dto) {

        BudgetResponseDto response = budgetService.update(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Presupuesto actualizado correctamente", response));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Aprobar o rechazar un presupuesto")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'CUSTOMER')")
    public ResponseEntity<ApiResponse<BudgetResponseDto>> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody BudgetStatusChangeDto dto,
            Authentication authentication) {

        String email = (authentication != null) ? authentication.getName() : null;
        BudgetResponseDto response = budgetService.changeStatus(id, dto, email);
        return ResponseEntity.ok(ApiResponse.success("Estado del presupuesto actualizado a " + dto.getNewStatus(), response));
    }

    // ── DELETE ───────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un presupuesto (solo permitido si no está aprobado)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        budgetService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Presupuesto eliminado correctamente", null));
    }
}

