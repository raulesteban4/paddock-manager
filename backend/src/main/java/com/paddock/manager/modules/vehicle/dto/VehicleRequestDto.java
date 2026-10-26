package com.paddock.manager.modules.vehicle.dto;

import com.paddock.manager.modules.vehicle.entity.FuelType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

/**
 * DTO para la creación y edición de vehículos.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos para registrar o actualizar un vehículo")
public class VehicleRequestDto {

    @NotBlank(message = "La matrícula es obligatoria")
    @Size(min = 4, max = 20, message = "La matrícula debe tener entre 4 y 20 caracteres")
    @Schema(description = "Matrícula del vehículo", example = "1234ABC")
    private String licensePlate;

    @NotBlank(message = "El número de bastidor (VIN) es obligatorio")
    @Size(min = 17, max = 17, message = "El número de bastidor (VIN) debe tener exactamente 17 caracteres alfanuméricos")
    @Schema(description = "Número de bastidor / VIN", example = "WVWZZZ3CZWE123456")
    private String vin;

    @NotBlank(message = "La marca es obligatoria")
    @Size(max = 100, message = "La marca no puede superar los 100 caracteres")
    @Schema(description = "Marca del fabricante", example = "Volkswagen")
    private String brand;

    @NotBlank(message = "El modelo es obligatorio")
    @Size(max = 100, message = "El modelo no puede superar los 100 caracteres")
    @Schema(description = "Modelo del vehículo", example = "Golf 2.0 TDI")
    private String model;

    @NotNull(message = "El año de fabricación es obligatorio")
    @Min(value = 1900, message = "El año debe ser igual o superior a 1900")
    @Max(value = 2100, message = "El año no puede ser superior a 2100")
    @Schema(description = "Año de matriculación/fabricación", example = "2020")
    private Integer year;

    @NotNull(message = "El tipo de combustible es obligatorio")
    @Schema(description = "Tipo de combustible (GASOLINE, DIESEL, HYBRID, ELECTRIC, LPG)", example = "DIESEL")
    private FuelType fuelType;

    @Size(max = 100, message = "La especificación del motor no puede superar los 100 caracteres")
    @Schema(description = "Motorización o código de motor", example = "2.0 TDI 150cv")
    private String engine;

    @NotNull(message = "El kilometraje es obligatorio")
    @Min(value = 0, message = "El kilometraje no puede ser negativo")
    @Schema(description = "Kilómetros actuales registrados", example = "85000")
    private Integer mileage;

    @NotNull(message = "El ID del cliente propietario es obligatorio")
    @Schema(description = "Identificador del cliente propietario", example = "1")
    private Long customerId;
}