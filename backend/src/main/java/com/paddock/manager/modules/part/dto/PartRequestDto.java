package com.paddock.manager.modules.part.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos para crear o actualizar un repuesto en el catálogo")
public class PartRequestDto {

    @NotBlank(message = "El código de referencia es obligatorio")
    @Size(min = 2, max = 50, message = "El código de referencia debe tener entre 2 y 50 caracteres")
    @Schema(description = "Código de referencia único del recambio", example = "FIL-ACE-01")
    private String referenceCode;

    @NotBlank(message = "El nombre de la pieza es obligatorio")
    @Size(min = 2, max = 150, message = "El nombre debe tener entre 2 y 150 caracteres")
    @Schema(description = "Nombre comercial del repuesto", example = "Filtro de Aceite Mann W712")
    private String name;

    @Schema(description = "Descripción técnica detallada", example = "Filtro blindado para grupo VAG y motores diésel")
    private String description;

    @Schema(description = "Fabricante o marca de la pieza", example = "Mann-Filter")
    private String manufacturer;

    @NotNull(message = "El stock inicial es obligatorio")
    @Min(value = 0, message = "El stock no puede ser negativo")
    @Schema(description = "Existencias actuales en almacén", example = "25")
    private Integer stock;

    @NotNull(message = "El stock mínimo es obligatorio")
    @Min(value = 0, message = "El stock mínimo no puede ser negativo")
    @Schema(description = "Umbral mínimo de existencias para alerta de reposición", example = "5")
    private Integer minStock;

    @NotNull(message = "El precio de venta unitario es obligatorio")
    @DecimalMin(value = "0.00", message = "El precio de venta no puede ser negativo")
    @Schema(description = "Precio de venta al cliente sin IVA", example = "14.50")
    private BigDecimal unitPrice;

    @NotNull(message = "El precio de coste es obligatorio")
    @DecimalMin(value = "0.00", message = "El precio de coste no puede ser negativo")
    @Schema(description = "Precio de adquisición o coste de proveedor", example = "6.20")
    private BigDecimal costPrice;

    @Schema(description = "Proveedor habitual de la pieza", example = "Recambios Sur")
    private String supplier;
}

