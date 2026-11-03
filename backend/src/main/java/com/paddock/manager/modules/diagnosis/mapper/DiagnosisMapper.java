package com.paddock.manager.modules.diagnosis.mapper;

import com.paddock.manager.modules.diagnosis.dto.DiagnosisResponseDto;
import com.paddock.manager.modules.diagnosis.entity.Diagnosis;
import org.springframework.stereotype.Component;

/**
 * Mapper para convertir entre la entidad Diagnosis y su DTO de respuesta.
 */
@Component
public class DiagnosisMapper {

    public DiagnosisResponseDto toResponseDto(Diagnosis d) {
        if (d == null) return null;

        return DiagnosisResponseDto.builder()
                .id(d.getId())
                .repairOrderId(d.getRepairOrder() != null ? d.getRepairOrder().getId() : null)
                .orderNumber(d.getRepairOrder() != null ? d.getRepairOrder().getOrderNumber() : null)
                .mechanicId(d.getMechanic() != null ? d.getMechanic().getId() : null)
                .mechanicName(d.getMechanic() != null
                        ? d.getMechanic().getFirstName() + " " + d.getMechanic().getLastName()
                        : null)
                .symptoms(d.getSymptoms())
                .diagnosis(d.getDiagnosis())
                .recommendations(d.getRecommendations())
                .observations(d.getObservations())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }
}

