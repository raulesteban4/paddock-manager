package com.paddock.manager.modules.appointment.controller;

import com.paddock.manager.common.response.ApiResponse;
import com.paddock.manager.modules.appointment.dto.AppointmentRequestDto;
import com.paddock.manager.modules.appointment.dto.AppointmentResponseDto;
import com.paddock.manager.modules.appointment.entity.AppointmentStatus;
import com.paddock.manager.modules.appointment.service.AppointmentService;
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
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller para la gestión de Citas (Appointments).
 *
 * Endpoints:
 *   GET    /api/appointments            → Listado paginado con filtros
 *   GET    /api/appointments/{id}       → Detalle de una cita
 *   POST   /api/appointments            → Crear nueva cita
 *   PUT    /api/appointments/{id}       → Actualizar datos de cita
 *   PATCH  /api/appointments/{id}/status → Cambiar estado (máquina de estados)
 *   PATCH  /api/appointments/{id}/cancel → Cancelar una cita
 *   DELETE /api/appointments/{id}       → Eliminar cita
 */
@Slf4j
@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@Tag(name = "Citas", description = "Gestión de citas de taller: creación, consulta, cambio de estado y cancelación")
public class AppointmentController {

    private final AppointmentService appointmentService;

    // ─── GET /api/appointments ────────────────────────────────

    @GetMapping
    @Operation(
        summary = "Listar citas",
        description = "Devuelve todas las citas con paginación y filtros opcionales por estado, cliente o vehículo."
    )
    public ResponseEntity<ApiResponse<Page<AppointmentResponseDto>>> findAll(
            @Parameter(description = "Filtrar por estado") @RequestParam(required = false) AppointmentStatus status,
            @Parameter(description = "Filtrar por ID de cliente") @RequestParam(required = false) Long customerId,
            @Parameter(description = "Filtrar por ID de vehículo") @RequestParam(required = false) Long vehicleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("appointmentDateTime").ascending());
        Page<AppointmentResponseDto> result = appointmentService.findAll(status, customerId, vehicleId, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ─── GET /api/appointments/{id} ───────────────────────────

    @GetMapping("/{id}")
    @Operation(summary = "Obtener cita por ID")
    public ResponseEntity<ApiResponse<AppointmentResponseDto>> findById(@PathVariable Long id) {
        AppointmentResponseDto appointment = appointmentService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(appointment));
    }

    // ─── POST /api/appointments ───────────────────────────────

    @PostMapping
    @Operation(
        summary = "Crear nueva cita",
        description = "Registra una nueva cita. El vehículo debe pertenecer al cliente y no debe haber conflicto de horario."
    )
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<AppointmentResponseDto>> create(
            @Valid @RequestBody AppointmentRequestDto request) {

        log.info("POST /api/appointments - cliente ID: {}", request.getCustomerId());
        AppointmentResponseDto created = appointmentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Cita registrada exitosamente", created));
    }

    // ─── PUT /api/appointments/{id} ───────────────────────────

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar datos de una cita")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<AppointmentResponseDto>> update(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentRequestDto request) {

        log.info("PUT /api/appointments/{}", id);
        AppointmentResponseDto updated = appointmentService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cita actualizada exitosamente", updated));
    }

    // ─── PATCH /api/appointments/{id}/status ─────────────────

    @PatchMapping("/{id}/status")
    @Operation(
        summary = "Cambiar estado de una cita",
        description = "Flujo: PROGRAMADA → CONFIRMADA → EN_TALLER → COMPLETADA. Cancelar desde cualquier estado activo."
    )
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'MECHANIC')")
    public ResponseEntity<ApiResponse<AppointmentResponseDto>> changeStatus(
            @PathVariable Long id,
            @Parameter(description = "Nuevo estado", required = true)
            @RequestParam AppointmentStatus status) {

        log.info("PATCH /api/appointments/{}/status → {}", id, status);
        AppointmentResponseDto updated = appointmentService.changeStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Estado actualizado a " + status, updated));
    }

    // ─── PATCH /api/appointments/{id}/cancel ─────────────────

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancelar una cita")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<AppointmentResponseDto>> cancel(@PathVariable Long id) {
        log.info("PATCH /api/appointments/{}/cancel", id);
        AppointmentResponseDto cancelled = appointmentService.cancel(id);
        return ResponseEntity.ok(ApiResponse.success("Cita cancelada exitosamente", cancelled));
    }

    // ─── DELETE /api/appointments/{id} ────────────────────────

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar cita (solo PROGRAMADA o CANCELADA)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        log.info("DELETE /api/appointments/{}", id);
        appointmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Cita eliminada correctamente", null));
    }
}

