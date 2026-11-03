package com.paddock.manager.modules.diagnosis.controller;

import com.paddock.manager.common.response.ApiResponse;
import com.paddock.manager.modules.diagnosis.dto.DiagnosisRequestDto;
import com.paddock.manager.modules.diagnosis.dto.DiagnosisResponseDto;
import com.paddock.manager.modules.diagnosis.service.DiagnosisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/diagnoses")
@RequiredArgsConstructor
@Tag(name = "Diagnósticos Técnicos", description = "Registro y consulta de diagnósticos de averías vinculados a órdenes de reparación")
public class DiagnosisController {

    private final DiagnosisService diagnosisService;

    // ── CREATE ───────────────────────────────────────────────────────────────────

    @PostMapping
    @Operation(summary = "Registrar un nuevo diagnóstico técnico")
    @PreAuthorize("hasAnyRole('ADMIN', 'MECHANIC')")
    public ResponseEntity<ApiResponse<DiagnosisResponseDto>> create(
            @Valid @RequestBody DiagnosisRequestDto dto) {

        DiagnosisResponseDto response = diagnosisService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Diagnóstico registrado correctamente", response));
    }

    // ── READ ─────────────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @Operation(summary = "Obtener diagnóstico por ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'MECHANIC')")
    public ResponseEntity<ApiResponse<DiagnosisResponseDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(diagnosisService.getById(id)));
    }

    @GetMapping("/by-order/{repairOrderId}")
    @Operation(summary = "Obtener diagnóstico por ID de orden de reparación")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'MECHANIC')")
    public ResponseEntity<ApiResponse<DiagnosisResponseDto>> getByRepairOrderId(
            @PathVariable Long repairOrderId) {
        return ResponseEntity.ok(ApiResponse.success(diagnosisService.getByRepairOrderId(repairOrderId)));
    }

    @GetMapping("/by-order-number/{orderNumber}")
    @Operation(summary = "Obtener diagnóstico por número de orden (ej: ORD-2026-0001)")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'MECHANIC')")
    public ResponseEntity<ApiResponse<DiagnosisResponseDto>> getByOrderNumber(
            @PathVariable String orderNumber) {
        return ResponseEntity.ok(ApiResponse.success(diagnosisService.getByOrderNumber(orderNumber)));
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar un diagnóstico existente")
    @PreAuthorize("hasAnyRole('ADMIN', 'MECHANIC')")
    public ResponseEntity<ApiResponse<DiagnosisResponseDto>> update(
            @PathVariable Long id,
            @Valid @RequestBody DiagnosisRequestDto dto) {

        DiagnosisResponseDto response = diagnosisService.update(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Diagnóstico actualizado correctamente", response));
    }

    // ── DELETE ───────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un diagnóstico (solo en estados DIAGNOSIS o QUOTE_PENDING)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        diagnosisService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Diagnóstico eliminado correctamente", null));
    }
}

