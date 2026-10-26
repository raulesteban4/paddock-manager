package com.paddock.manager.modules.customer.controller;

import com.paddock.manager.common.response.ApiResponse;
import com.paddock.manager.modules.customer.dto.CustomerRequestDto;
import com.paddock.manager.modules.customer.dto.CustomerResponseDto;
import com.paddock.manager.modules.customer.service.CustomerService;
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

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@Tag(name = "Clientes", description = "Operaciones CRUD y búsqueda de clientes del taller")
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    @Operation(summary = "Listar clientes", description = "Obtiene clientes paginados con opción de filtro de búsqueda.")
    public ResponseEntity<ApiResponse<Page<CustomerResponseDto>>> getAllCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String[] sort
    ) {
        Sort.Direction direction = Sort.Direction.fromString(sort.length > 1 ? sort[1] : "desc");
        String property = sort[0];
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, property));

        Page<CustomerResponseDto> customers = customerService.findAll(search, pageable);
        return ResponseEntity.ok(ApiResponse.success("Clientes obtenidos correctamente", customers));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener cliente por ID", description = "Devuelve el detalle de un cliente dado su identificador.")
    public ResponseEntity<ApiResponse<CustomerResponseDto>> getCustomerById(@PathVariable Long id) {
        CustomerResponseDto customer = customerService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(customer));
    }

    @GetMapping("/by-dni/{dniCif}")
    @Operation(summary = "Buscar cliente por DNI/CIF", description = "Búsqueda rápida para recepcionistas por documento identificativo.")
    public ResponseEntity<ApiResponse<CustomerResponseDto>> getCustomerByDni(@PathVariable String dniCif) {
        CustomerResponseDto customer = customerService.findByDniCif(dniCif);
        return ResponseEntity.ok(ApiResponse.success(customer));
    }

    @PostMapping
    @Operation(summary = "Crear nuevo cliente", description = "Registra un cliente validando unicidad de DNI y email.")
    public ResponseEntity<ApiResponse<CustomerResponseDto>> createCustomer(
            @Valid @RequestBody CustomerRequestDto requestDto
    ) {
        CustomerResponseDto created = customerService.create(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cliente creado exitosamente", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar cliente", description = "Modifica los datos de un cliente existente.")
    public ResponseEntity<ApiResponse<CustomerResponseDto>> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerRequestDto requestDto
    ) {
        CustomerResponseDto updated = customerService.update(id, requestDto);
        return ResponseEntity.ok(ApiResponse.success("Cliente actualizado exitosamente", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar cliente", description = "Elimina un cliente por su ID.")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(@PathVariable Long id) {
        customerService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Cliente eliminado exitosamente", null));
    }
}