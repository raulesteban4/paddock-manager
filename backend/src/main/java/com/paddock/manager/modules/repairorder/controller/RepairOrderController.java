package com.paddock.manager.modules.repairorder.controller;

import com.paddock.manager.common.response.ApiResponse;
import com.paddock.manager.modules.repairorder.dto.RepairOrderRequestDto;
import com.paddock.manager.modules.repairorder.dto.RepairOrderResponseDto;
import com.paddock.manager.modules.repairorder.dto.StatusChangeRequestDto;
import com.paddock.manager.modules.repairorder.entity.RepairOrderPriority;
import com.paddock.manager.modules.repairorder.entity.RepairOrderStatus;
import com.paddock.manager.modules.repairorder.service.RepairOrderService;
import com.paddock.manager.modules.user.entity.User;
import com.paddock.manager.modules.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/repair-orders")
@RequiredArgsConstructor
@Tag(name = "Órdenes de Reparación", description = "Gestión integral del ciclo de trabajo de vehículos en taller")
public class RepairOrderController {

    private final RepairOrderService repairOrderService;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "Listar órdenes de reparación con filtros y paginación")
    public ResponseEntity<ApiResponse<Page<RepairOrderResponseDto>>> findAll(
            @RequestParam(required = false) RepairOrderStatus status,
            @RequestParam(required = false) RepairOrderPriority priority,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) Long mechanicId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String[] sort) {

        Sort.Direction direction = Sort.Direction.fromString(sort.length > 1 ? sort[1] : "desc");
        String property = sort[0];
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, property));

        Page<RepairOrderResponseDto> result = repairOrderService.findAll(
                status, priority, customerId, vehicleId, mechanicId, search, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener orden por ID con historial")
    public ResponseEntity<ApiResponse<RepairOrderResponseDto>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(repairOrderService.findById(id)));
    }

    @GetMapping("/number/{orderNumber}")
    @Operation(summary = "Buscar orden por código de orden (ej: ORD-2026-0001)")
    public ResponseEntity<ApiResponse<RepairOrderResponseDto>> findByOrderNumber(@PathVariable String orderNumber) {
        return ResponseEntity.ok(ApiResponse.success(repairOrderService.findByOrderNumber(orderNumber)));
    }

    @PostMapping
    @Operation(summary = "Crear nueva orden de reparación")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<RepairOrderResponseDto>> create(
            @Valid @RequestBody RepairOrderRequestDto request) {

        RepairOrderResponseDto created = repairOrderService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Orden de reparación creada con éxito", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar datos de una orden de reparación")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<RepairOrderResponseDto>> update(
            @PathVariable Long id,
            @Valid @RequestBody RepairOrderRequestDto request) {

        RepairOrderResponseDto updated = repairOrderService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Orden de reparación actualizada", updated));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Cambiar estado de la orden de reparación")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'MECHANIC')")
    public ResponseEntity<ApiResponse<RepairOrderResponseDto>> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusChangeRequestDto request,
            Authentication authentication) {

        String userEmail = authentication != null ? authentication.getName() : null;
        RepairOrderResponseDto updated = repairOrderService.changeStatus(id, request, userEmail);
        return ResponseEntity.ok(ApiResponse.success("Estado actualizado a " + request.getNewStatus(), updated));
    }

    @PatchMapping("/{id}/assign-mechanic")
    @Operation(summary = "Asignar mecánico a la orden de reparación")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<RepairOrderResponseDto>> assignMechanic(
            @PathVariable Long id,
            @RequestParam(required = false) Long mechanicId) {

        RepairOrderResponseDto updated = repairOrderService.assignMechanic(id, mechanicId);
        return ResponseEntity.ok(ApiResponse.success("Mecánico asignado correctamente", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar orden de reparación (solo en estado RECEIVED o CANCELLED)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        repairOrderService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Orden eliminada correctamente", null));
    }

    @GetMapping("/mechanics")
    @Operation(summary = "Obtener lista de mecánicos disponibles para asignación")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMechanics() {
        List<User> mechanics = userRepository.findByRole_Name("ROLE_MECHANIC");
        List<Map<String, Object>> response = mechanics.stream()
                .map(m -> Map.of(
                        "id", (Object) m.getId(),
                        "fullName", m.getFullName(),
                        "email", m.getEmail(),
                        "phone", m.getPhone() != null ? m.getPhone() : ""
                ))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

