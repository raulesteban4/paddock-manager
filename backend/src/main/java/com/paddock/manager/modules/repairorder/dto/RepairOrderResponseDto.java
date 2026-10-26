package com.paddock.manager.modules.repairorder.dto;

import com.paddock.manager.modules.repairorder.entity.RepairOrderPriority;
import com.paddock.manager.modules.repairorder.entity.RepairOrderStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos completos de respuesta de una Orden de Reparación")
public class RepairOrderResponseDto {

    private Long id;
    private String orderNumber;

    // Cliente
    private Long customerId;
    private String customerName;
    private String customerDni;
    private String customerPhone;

    // Vehículo
    private Long vehicleId;
    private String licensePlate;
    private String vehicleDescription;

    // Mecánico asignado
    private Long mechanicId;
    private String mechanicName;

    // Fechas y Kilometraje
    private ZonedDateTime entryDate;
    private ZonedDateTime estimatedDeliveryDate;
    private Integer mileageAtEntry;

    // Detalles del servicio
    private String customerIssue;
    private String observations;
    private RepairOrderPriority priority;
    private RepairOrderStatus status;

    // Historial de cambios
    private List<StatusHistoryResponseDto> statusHistory;

    // Auditoría
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

