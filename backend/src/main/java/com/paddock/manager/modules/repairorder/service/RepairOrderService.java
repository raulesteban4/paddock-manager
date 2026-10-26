package com.paddock.manager.modules.repairorder.service;

import com.paddock.manager.modules.repairorder.dto.RepairOrderRequestDto;
import com.paddock.manager.modules.repairorder.dto.RepairOrderResponseDto;
import com.paddock.manager.modules.repairorder.dto.StatusChangeRequestDto;
import com.paddock.manager.modules.repairorder.entity.RepairOrderPriority;
import com.paddock.manager.modules.repairorder.entity.RepairOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface RepairOrderService {

    Page<RepairOrderResponseDto> findAll(
            RepairOrderStatus status,
            RepairOrderPriority priority,
            Long customerId,
            Long vehicleId,
            Long mechanicId,
            String search,
            Pageable pageable
    );

    RepairOrderResponseDto findById(Long id);

    RepairOrderResponseDto findByOrderNumber(String orderNumber);

    RepairOrderResponseDto create(RepairOrderRequestDto request);

    RepairOrderResponseDto update(Long id, RepairOrderRequestDto request);

    RepairOrderResponseDto changeStatus(Long id, StatusChangeRequestDto request, String userEmail);

    RepairOrderResponseDto assignMechanic(Long id, Long mechanicId);

    void delete(Long id);
}

