package com.paddock.manager.modules.vehicle.dto;

import com.paddock.manager.modules.vehicle.entity.FuelType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO que representa la información pública devuelta de un vehículo con los datos de su propietario.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Información del vehículo devuelta por la API")
public class VehicleResponseDto {

    @Schema(description = "ID único del vehículo", example = "1")
    private Long id;

    @Schema(description = "Matrícula", example = "1234ABC")
    private String licensePlate;

    @Schema(description = "Número de bastidor / VIN", example = "WVWZZZ3CZWE123456")
    private String vin;

    @Schema(description = "Marca", example = "Volkswagen")
    private String brand;

    @Schema(description = "Modelo", example = "Golf 2.0 TDI")
    private String model;

    @Schema(description = "Año", example = "2020")
    private Integer year;

    @Schema(description = "Tipo de combustible", example = "DIESEL")
    private FuelType fuelType;

    @Schema(description = "Motorización", example = "2.0 TDI 150cv")
    private String engine;

    @Schema(description = "Kilometraje", example = "85000")
    private Integer mileage;

    @Schema(description = "ID del cliente propietario", example = "1")
    private Long customerId;

    @Schema(description = "Nombre completo del propietario", example = "Juan Pérez López")
    private String customerName;

    @Schema(description = "DNI/CIF del propietario", example = "12345678Z")
    private String customerDni;

    @Schema(description = "Fecha de registro en el sistema")
    private LocalDateTime createdAt;

    @Schema(description = "Fecha de última modificación")
    private LocalDateTime updatedAt;
}