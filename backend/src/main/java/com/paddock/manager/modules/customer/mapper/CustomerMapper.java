package com.paddock.manager.modules.customer.mapper;

import com.paddock.manager.modules.customer.dto.CustomerRequestDto;
import com.paddock.manager.modules.customer.dto.CustomerResponseDto;
import com.paddock.manager.modules.customer.entity.Customer;
import org.springframework.stereotype.Component;

/**
 * Mapper para transformar entre la entidad Customer y sus DTOs.
 * Facilita la trazabilidad y el desacoplamiento sin magia de librerías externas complejas.
 */
@Component
public class CustomerMapper {

    public Customer toEntity(CustomerRequestDto dto) {
        if (dto == null) {
            return null;
        }
        return Customer.builder()
                .dniCif(dto.getDniCif() != null ? dto.getDniCif().trim().toUpperCase() : null)
                .firstName(dto.getFirstName() != null ? dto.getFirstName().trim() : null)
                .lastName(dto.getLastName() != null ? dto.getLastName().trim() : null)
                .email(dto.getEmail() != null ? dto.getEmail().trim().toLowerCase() : null)
                .phone(dto.getPhone() != null ? dto.getPhone().trim() : null)
                .address(dto.getAddress() != null ? dto.getAddress().trim() : null)
                .city(dto.getCity() != null ? dto.getCity().trim() : null)
                .build();
    }

    public CustomerResponseDto toResponseDto(Customer entity) {
        if (entity == null) {
            return null;
        }
        return CustomerResponseDto.builder()
                .id(entity.getId())
                .dniCif(entity.getDniCif())
                .firstName(entity.getFirstName())
                .lastName(entity.getLastName())
                .fullName(entity.getFullName())
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .address(entity.getAddress())
                .city(entity.getCity())
                .userId(entity.getUserId())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public void updateEntityFromDto(Customer entity, CustomerRequestDto dto) {
        if (entity == null || dto == null) {
            return;
        }
        entity.setDniCif(dto.getDniCif() != null ? dto.getDniCif().trim().toUpperCase() : entity.getDniCif());
        entity.setFirstName(dto.getFirstName() != null ? dto.getFirstName().trim() : entity.getFirstName());
        entity.setLastName(dto.getLastName() != null ? dto.getLastName().trim() : entity.getLastName());
        entity.setEmail(dto.getEmail() != null ? dto.getEmail().trim().toLowerCase() : entity.getEmail());
        entity.setPhone(dto.getPhone() != null ? dto.getPhone().trim() : entity.getPhone());
        entity.setAddress(dto.getAddress() != null ? dto.getAddress().trim() : entity.getAddress());
        entity.setCity(dto.getCity() != null ? dto.getCity().trim() : entity.getCity());
    }
}