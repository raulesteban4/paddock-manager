package com.paddock.manager.modules.vehicle.controller;

import com.paddock.manager.common.response.ApiResponse;
import com.paddock.manager.modules.vehicle.dto.VehicleRequestDto;
import com.paddock.manager.modules.vehicle.dto.VehicleResponseDto;
import com.paddock.manager.modules.vehicle.service.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
@Tag(name = "Vehículos", description = "Operaciones CRUD y búsqueda de vehículos del taller")
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    @Operation(summary = "Listar vehículos", description = "Obtiene vehículos paginados con opción de filtro de búsqueda.")
    public ResponseEntity<ApiResponse<Page<VehicleResponseDto>>> getAllVehicles(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String[] sort
    ) {
        Sort.Direction direction = Sort.Direction.fromString(sort.length > 1 ? sort[1] : "desc");
        String property = sort[0];
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, property));

        Page<VehicleResponseDto> vehicles = vehicleService.findAll(search, pageable);
        return ResponseEntity.ok(ApiResponse.success("Vehículos obtenidos correctamente", vehicles));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener vehículo por ID", description = "Devuelve el detalle de un vehículo dado su identificador.")
    public ResponseEntity<ApiResponse<VehicleResponseDto>> getVehicleById(@PathVariable Long id) {
        VehicleResponseDto vehicle = vehicleService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(vehicle));
    }

    @GetMapping("/by-plate/{licensePlate}")
    @Operation(summary = "Buscar vehículo por matrícula", description = "Búsqueda directa de vehículo por su matrícula.")
    public ResponseEntity<ApiResponse<VehicleResponseDto>> getVehicleByPlate(@PathVariable String licensePlate) {
        VehicleResponseDto vehicle = vehicleService.findByLicensePlate(licensePlate);
        return ResponseEntity.ok(ApiResponse.success(vehicle));
    }

    @GetMapping("/by-customer/{customerId}")
    @Operation(summary = "Listar vehículos por cliente", description = "Obtiene todos los vehículos asociados a un cliente propietario.")
    public ResponseEntity<ApiResponse<List<VehicleResponseDto>>> getVehiclesByCustomer(@PathVariable Long customerId) {
        List<VehicleResponseDto> vehicles = vehicleService.findByCustomerId(customerId);
        return ResponseEntity.ok(ApiResponse.success("Vehículos del cliente obtenidos", vehicles));
    }

    @PostMapping
    @Operation(summary = "Registrar nuevo vehículo", description = "Registra un vehículo validando unicidad de matrícula y bastidor, y existencia del cliente.")
    public ResponseEntity<ApiResponse<VehicleResponseDto>> createVehicle(
            @Valid @RequestBody VehicleRequestDto requestDto
    ) {
        VehicleResponseDto created = vehicleService.create(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Vehículo registrado exitosamente", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar vehículo", description = "Modifica los datos de un vehículo existente.")
    public ResponseEntity<ApiResponse<VehicleResponseDto>> updateVehicle(
            @PathVariable Long id,
            @Valid @RequestBody VehicleRequestDto requestDto
    ) {
        VehicleResponseDto updated = vehicleService.update(id, requestDto);
        return ResponseEntity.ok(ApiResponse.success("Vehículo actualizado exitosamente", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar vehículo", description = "Elimina un vehículo por su ID.")
    public ResponseEntity<ApiResponse<Void>> deleteVehicle(@PathVariable Long id) {
        vehicleService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Vehículo eliminado exitosamente", null));
    }
}