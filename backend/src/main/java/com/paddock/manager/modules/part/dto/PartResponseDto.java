package com.paddock.manager.modules.part.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos de respuesta de una pieza o repuesto")
public class PartResponseDto {

    private Long id;
    private String referenceCode;
    private String name;
    private String description;
    private String manufacturer;
    private Integer stock;
    private Integer minStock;
    private BigDecimal unitPrice;
    private BigDecimal costPrice;
    private String supplier;
    private boolean lowStock;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

