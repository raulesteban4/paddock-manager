package com.paddock.manager.modules.diagnosis.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos de respuesta de un Diagnóstico Técnico")
public class DiagnosisResponseDto {

    private Long id;

    // Orden de reparación
    private Long repairOrderId;
    private String orderNumber;

    // Mecánico
    private Long mechanicId;
    private String mechanicName;

    // Diagnóstico
    private String symptoms;
    private String diagnosis;
    private String recommendations;
    private String observations;

    // Auditoría
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

