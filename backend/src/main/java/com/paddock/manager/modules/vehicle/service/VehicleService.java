package com.paddock.manager.modules.vehicle.service;

import com.paddock.manager.modules.vehicle.dto.VehicleRequestDto;
import com.paddock.manager.modules.vehicle.dto.VehicleResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface VehicleService {

    Page<VehicleResponseDto> findAll(String search, Pageable pageable);

    VehicleResponseDto findById(Long id);

    VehicleResponseDto findByLicensePlate(String licensePlate);

    List<VehicleResponseDto> findByCustomerId(Long customerId);

    VehicleResponseDto create(VehicleRequestDto requestDto);

    VehicleResponseDto update(Long id, VehicleRequestDto requestDto);

    void delete(Long id);
}