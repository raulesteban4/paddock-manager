package com.paddock.manager.modules.repairorder.dto;

import com.paddock.manager.modules.repairorder.entity.RepairOrderStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Registro de historial de auditoría de cambio de estado")
public class StatusHistoryResponseDto {

    private Long id;
    private RepairOrderStatus previousStatus;
    private RepairOrderStatus newStatus;
    private Long changedByUserId;
    private String changedByUserName;
    private String notes;
    private LocalDateTime changedAt;
}

