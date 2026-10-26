package com.paddock.manager.modules.repairorder.mapper;

import com.paddock.manager.modules.repairorder.dto.RepairOrderResponseDto;
import com.paddock.manager.modules.repairorder.dto.StatusHistoryResponseDto;
import com.paddock.manager.modules.repairorder.entity.RepairOrder;
import com.paddock.manager.modules.repairorder.entity.StatusHistory;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class RepairOrderMapper {

    public RepairOrderResponseDto toResponseDto(RepairOrder order) {
        return toResponseDto(order, Collections.emptyList());
    }

    public RepairOrderResponseDto toResponseDto(RepairOrder order, List<StatusHistory> historyList) {
        if (order == null) return null;

        var customer = order.getCustomer();
        var vehicle = order.getVehicle();
        var mechanic = order.getMechanic();

        List<StatusHistoryResponseDto> historyDtos = historyList != null
                ? historyList.stream().map(this::toStatusHistoryDto).toList()
                : Collections.emptyList();

        return RepairOrderResponseDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                // Cliente
                .customerId(customer.getId())
                .customerName(customer.getFirstName() + " " + customer.getLastName())
                .customerDni(customer.getDniCif())
                .customerPhone(customer.getPhone())
                // Vehículo
                .vehicleId(vehicle.getId())
                .licensePlate(vehicle.getLicensePlate())
                .vehicleDescription(vehicle.getBrand() + " " + vehicle.getModel() + " (" + vehicle.getYear() + ")")
                // Mecánico asignado
                .mechanicId(mechanic != null ? mechanic.getId() : null)
                .mechanicName(mechanic != null ? mechanic.getFullName() : null)
                // Fechas y Kilometraje
                .entryDate(order.getEntryDate())
                .estimatedDeliveryDate(order.getEstimatedDeliveryDate())
                .mileageAtEntry(order.getMileageAtEntry())
                // Estado y Prioridad
                .customerIssue(order.getCustomerIssue())
                .observations(order.getObservations())
                .priority(order.getPriority())
                .status(order.getStatus())
                // Historial
                .statusHistory(historyDtos)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    public StatusHistoryResponseDto toStatusHistoryDto(StatusHistory history) {
        if (history == null) return null;

        var user = history.getChangedBy();

        return StatusHistoryResponseDto.builder()
                .id(history.getId())
                .previousStatus(history.getPreviousStatus())
                .newStatus(history.getNewStatus())
                .changedByUserId(user != null ? user.getId() : null)
                .changedByUserName(user != null ? user.getFullName() : "Sistema")
                .notes(history.getNotes())
                .changedAt(history.getChangedAt())
                .build();
    }
}

