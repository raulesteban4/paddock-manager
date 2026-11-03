package com.paddock.manager.modules.budget.mapper;

import com.paddock.manager.modules.budget.dto.BudgetItemResponseDto;
import com.paddock.manager.modules.budget.dto.BudgetResponseDto;
import com.paddock.manager.modules.budget.entity.Budget;
import com.paddock.manager.modules.budget.entity.BudgetItem;
import com.paddock.manager.modules.customer.entity.Customer;
import com.paddock.manager.modules.repairorder.entity.RepairOrder;
import com.paddock.manager.modules.vehicle.entity.Vehicle;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class BudgetMapper {

    public BudgetResponseDto toResponseDto(Budget b) {
        if (b == null) return null;

        RepairOrder ro = b.getRepairOrder();
        Customer c = (ro != null) ? ro.getCustomer() : null;
        Vehicle v = (ro != null) ? ro.getVehicle() : null;

        List<BudgetItemResponseDto> itemsDto = (b.getItems() != null)
                ? b.getItems().stream().map(this::toItemResponseDto).toList()
                : Collections.emptyList();

        return BudgetResponseDto.builder()
                .id(b.getId())
                .repairOrderId(ro != null ? ro.getId() : null)
                .orderNumber(ro != null ? ro.getOrderNumber() : null)
                .customerId(c != null ? c.getId() : null)
                .customerName(c != null ? c.getFirstName() + " " + c.getLastName() : null)
                .customerPhone(c != null ? c.getPhone() : null)
                .customerEmail(c != null ? c.getEmail() : null)
                .licensePlate(v != null ? v.getLicensePlate() : null)
                .vehicleModel(v != null ? v.getBrand() + " " + v.getModel() : null)
                .status(b.getStatus())
                .subtotal(b.getSubtotal())
                .taxRate(b.getTaxRate())
                .taxAmount(b.getTaxAmount())
                .total(b.getTotal())
                .customerNotes(b.getCustomerNotes())
                .items(itemsDto)
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }

    public BudgetItemResponseDto toItemResponseDto(BudgetItem item) {
        if (item == null) return null;
        return BudgetItemResponseDto.builder()
                .id(item.getId())
                .itemType(item.getItemType())
                .description(item.getDescription())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .total(item.getTotal())
                .build();
    }
}

