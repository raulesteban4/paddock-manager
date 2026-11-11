package com.paddock.manager.modules.part.mapper;

import com.paddock.manager.modules.part.dto.PartRequestDto;
import com.paddock.manager.modules.part.dto.PartResponseDto;
import com.paddock.manager.modules.part.entity.Part;
import org.springframework.stereotype.Component;

@Component
public class PartMapper {

    public PartResponseDto toResponseDto(Part part) {
        if (part == null) return null;

        return PartResponseDto.builder()
                .id(part.getId())
                .referenceCode(part.getReferenceCode())
                .name(part.getName())
                .description(part.getDescription())
                .manufacturer(part.getManufacturer())
                .stock(part.getStock())
                .minStock(part.getMinStock())
                .unitPrice(part.getUnitPrice())
                .costPrice(part.getCostPrice())
                .supplier(part.getSupplier())
                .lowStock(part.isLowStock())
                .createdAt(part.getCreatedAt())
                .updatedAt(part.getUpdatedAt())
                .build();
    }

    public Part toEntity(PartRequestDto dto) {
        if (dto == null) return null;

        return Part.builder()
                .referenceCode(dto.getReferenceCode().trim().toUpperCase())
                .name(dto.getName().trim())
                .description(dto.getDescription())
                .manufacturer(dto.getManufacturer() != null ? dto.getManufacturer().trim() : null)
                .stock(dto.getStock())
                .minStock(dto.getMinStock())
                .unitPrice(dto.getUnitPrice())
                .costPrice(dto.getCostPrice())
                .supplier(dto.getSupplier() != null ? dto.getSupplier().trim() : null)
                .build();
    }

    public void updateEntityFromDto(Part part, PartRequestDto dto) {
        if (part == null || dto == null) return;

        part.setReferenceCode(dto.getReferenceCode().trim().toUpperCase());
        part.setName(dto.getName().trim());
        part.setDescription(dto.getDescription());
        part.setManufacturer(dto.getManufacturer() != null ? dto.getManufacturer().trim() : null);
        part.setStock(dto.getStock());
        part.setMinStock(dto.getMinStock());
        part.setUnitPrice(dto.getUnitPrice());
        part.setCostPrice(dto.getCostPrice());
        part.setSupplier(dto.getSupplier() != null ? dto.getSupplier().trim() : null);
    }
}

