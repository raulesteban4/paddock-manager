package com.paddock.manager.modules.vehicle.mapper;

import com.paddock.manager.modules.customer.entity.Customer;
import com.paddock.manager.modules.vehicle.dto.VehicleRequestDto;
import com.paddock.manager.modules.vehicle.dto.VehicleResponseDto;
import com.paddock.manager.modules.vehicle.entity.Vehicle;
import org.springframework.stereotype.Component;

/**
 * Mapper para transformar entre la entidad Vehicle y sus DTOs.
 */
@Component
public class VehicleMapper {

    public Vehicle toEntity(VehicleRequestDto dto, Customer customer) {
        if (dto == null) {
            return null;
        }
        return Vehicle.builder()
                .licensePlate(dto.getLicensePlate() != null ? dto.getLicensePlate().trim().toUpperCase() : null)
                .vin(dto.getVin() != null ? dto.getVin().trim().toUpperCase() : null)
                .brand(dto.getBrand() != null ? dto.getBrand().trim() : null)
                .model(dto.getModel() != null ? dto.getModel().trim() : null)
                .year(dto.getYear())
                .fuelType(dto.getFuelType())
                .engine(dto.getEngine() != null ? dto.getEngine().trim() : null)
                .mileage(dto.getMileage())
                .customer(customer)
                .build();
    }

    public VehicleResponseDto toResponseDto(Vehicle entity) {
        if (entity == null) {
            return null;
        }
        Customer customer = entity.getCustomer();
        return VehicleResponseDto.builder()
                .id(entity.getId())
                .licensePlate(entity.getLicensePlate())
                .vin(entity.getVin())
                .brand(entity.getBrand())
                .model(entity.getModel())
                .year(entity.getYear())
                .fuelType(entity.getFuelType())
                .engine(entity.getEngine())
                .mileage(entity.getMileage())
                .customerId(customer != null ? customer.getId() : null)
                .customerName(customer != null ? customer.getFullName() : null)
                .customerDni(customer != null ? customer.getDniCif() : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public void updateEntityFromDto(Vehicle entity, VehicleRequestDto dto, Customer customer) {
        if (entity == null || dto == null) {
            return;
        }
        entity.setLicensePlate(dto.getLicensePlate() != null ? dto.getLicensePlate().trim().toUpperCase() : entity.getLicensePlate());
        entity.setVin(dto.getVin() != null ? dto.getVin().trim().toUpperCase() : entity.getVin());
        entity.setBrand(dto.getBrand() != null ? dto.getBrand().trim() : entity.getBrand());
        entity.setModel(dto.getModel() != null ? dto.getModel().trim() : entity.getModel());
        entity.setYear(dto.getYear() != null ? dto.getYear() : entity.getYear());
        entity.setFuelType(dto.getFuelType() != null ? dto.getFuelType() : entity.getFuelType());
        entity.setEngine(dto.getEngine() != null ? dto.getEngine().trim() : entity.getEngine());
        entity.setMileage(dto.getMileage() != null ? dto.getMileage() : entity.getMileage());
        if (customer != null) {
            entity.setCustomer(customer);
        }
    }
}