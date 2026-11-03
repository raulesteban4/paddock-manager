package com.paddock.manager.modules.budget.dto;

import com.paddock.manager.modules.budget.entity.BudgetStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos completos de respuesta de un Presupuesto")
public class BudgetResponseDto {

    private Long id;

    // Orden de reparación
    private Long repairOrderId;
    private String orderNumber;

    // Datos del cliente y vehículo vinculados
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String licensePlate;
    private String vehicleModel;

    // Estado y totales económicos
    private BudgetStatus status;
    private BigDecimal subtotal;
    private BigDecimal taxRate;
    private BigDecimal taxAmount;
    private BigDecimal total;
    private String customerNotes;

    // Desglose de partidas
    private List<BudgetItemResponseDto> items;

    // Auditoría
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

