package com.paddock.manager.modules.part.controller;

import com.paddock.manager.common.response.ApiResponse;
import com.paddock.manager.modules.part.dto.InventoryStatsDto;
import com.paddock.manager.modules.part.dto.PartRequestDto;
import com.paddock.manager.modules.part.dto.PartResponseDto;
import com.paddock.manager.modules.part.dto.StockAdjustmentDto;
import com.paddock.manager.modules.part.service.PartService;
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
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/parts")
@RequiredArgsConstructor
@Tag(name = "Inventario y Repuestos", description = "Gestión de piezas, existencias, umbrales mínimos y valoración de stock")
public class PartController {

    private final PartService partService;

    @PostMapping
    @Operation(summary = "Dar de alta un nuevo repuesto en inventario")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PartResponseDto>> create(@Valid @RequestBody PartRequestDto dto) {
        PartResponseDto response = partService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Repuesto dado de alta correctamente", response));
    }

    @GetMapping
    @Operation(summary = "Listar repuestos con soporte para búsqueda libre y filtro de stock bajo")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'MECHANIC')")
    public ResponseEntity<ApiResponse<Page<PartResponseDto>>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean lowStockOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name,asc") String[] sort) {

        Sort.Direction direction = Sort.Direction.fromString(sort.length > 1 ? sort[1] : "asc");
        String property = sort[0];
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, property));

        Page<PartResponseDto> result = partService.findAll(search, lowStockOnly, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener detalle de un repuesto por su ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'MECHANIC')")
    public ResponseEntity<ApiResponse<PartResponseDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(partService.getById(id)));
    }

    @GetMapping("/by-reference/{referenceCode}")
    @Operation(summary = "Obtener repuesto por código de referencia único")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'MECHANIC')")
    public ResponseEntity<ApiResponse<PartResponseDto>> getByReferenceCode(@PathVariable String referenceCode) {
        return ResponseEntity.ok(ApiResponse.success(partService.getByReferenceCode(referenceCode)));
    }

    @GetMapping("/stats")
    @Operation(summary = "Obtener métricas y valoración global del inventario")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<InventoryStatsDto>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(partService.getInventoryStats()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar ficha técnica de un repuesto")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PartResponseDto>> update(
            @PathVariable Long id,
            @Valid @RequestBody PartRequestDto dto) {
        PartResponseDto response = partService.update(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Repuesto actualizado correctamente", response));
    }

    @PatchMapping("/{id}/stock")
    @Operation(summary = "Ajustar existencias de stock (+ / - unidades)")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'MECHANIC')")
    public ResponseEntity<ApiResponse<PartResponseDto>> adjustStock(
            @PathVariable Long id,
            @Valid @RequestBody StockAdjustmentDto dto) {
        PartResponseDto response = partService.adjustStock(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Stock ajustado correctamente", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un repuesto del inventario")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        partService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Repuesto eliminado correctamente", null));
    }
}

