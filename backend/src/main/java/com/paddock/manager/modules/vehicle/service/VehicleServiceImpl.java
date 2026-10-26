package com.paddock.manager.modules.vehicle.service;

import com.paddock.manager.common.exception.BusinessException;
import com.paddock.manager.common.exception.ResourceNotFoundException;
import com.paddock.manager.modules.customer.entity.Customer;
import com.paddock.manager.modules.customer.repository.CustomerRepository;
import com.paddock.manager.modules.vehicle.dto.VehicleRequestDto;
import com.paddock.manager.modules.vehicle.dto.VehicleResponseDto;
import com.paddock.manager.modules.vehicle.entity.Vehicle;
import com.paddock.manager.modules.vehicle.mapper.VehicleMapper;
import com.paddock.manager.modules.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final CustomerRepository customerRepository;
    private final VehicleMapper vehicleMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<VehicleResponseDto> findAll(String search, Pageable pageable) {
        log.debug("Listando vehículos con búsqueda: '{}', página: {}", search, pageable.getPageNumber());
        Page<Vehicle> vehicles;
        if (search != null && !search.trim().isEmpty()) {
            vehicles = vehicleRepository.searchVehicles(search.trim(), pageable);
        } else {
            vehicles = vehicleRepository.findAll(pageable);
        }
        return vehicles.map(vehicleMapper::toResponseDto);
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleResponseDto findById(Long id) {
        log.debug("Buscando vehículo por ID: {}", id);
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", "id", id));
        return vehicleMapper.toResponseDto(vehicle);
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleResponseDto findByLicensePlate(String licensePlate) {
        log.debug("Buscando vehículo por matrícula: {}", licensePlate);
        Vehicle vehicle = vehicleRepository.findByLicensePlate(licensePlate.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", "matrícula", licensePlate));
        return vehicleMapper.toResponseDto(vehicle);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleResponseDto> findByCustomerId(Long customerId) {
        log.debug("Listando vehículos del cliente ID: {}", customerId);
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Cliente", "id", customerId);
        }
        return vehicleRepository.findByCustomerId(customerId).stream()
                .map(vehicleMapper::toResponseDto)
                .toList();
    }

    @Override
    @Transactional
    public VehicleResponseDto create(VehicleRequestDto requestDto) {
        String normalizedPlate = requestDto.getLicensePlate().trim().toUpperCase();
        String normalizedVin = requestDto.getVin().trim().toUpperCase();

        log.info("Registrando nuevo vehículo con matrícula: {} y VIN: {}", normalizedPlate, normalizedVin);

        Customer customer = customerRepository.findById(requestDto.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", requestDto.getCustomerId()));

        if (vehicleRepository.existsByLicensePlate(normalizedPlate)) {
            throw new BusinessException("Ya existe un vehículo registrado con la matrícula: " + normalizedPlate);
        }

        if (vehicleRepository.existsByVin(normalizedVin)) {
            throw new BusinessException("Ya existe un vehículo registrado con el número de bastidor (VIN): " + normalizedVin);
        }

        Vehicle vehicle = vehicleMapper.toEntity(requestDto, customer);
        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        log.info("Vehículo registrado exitosamente con ID: {}", savedVehicle.getId());

        return vehicleMapper.toResponseDto(savedVehicle);
    }

    @Override
    @Transactional
    public VehicleResponseDto update(Long id, VehicleRequestDto requestDto) {
        log.info("Actualizando vehículo con ID: {}", id);

        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", "id", id));

        Customer customer = customerRepository.findById(requestDto.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", requestDto.getCustomerId()));

        String normalizedPlate = requestDto.getLicensePlate().trim().toUpperCase();
        String normalizedVin = requestDto.getVin().trim().toUpperCase();

        if (vehicleRepository.existsByLicensePlateAndIdNot(normalizedPlate, id)) {
            throw new BusinessException("Ya existe otro vehículo registrado con la matrícula: " + normalizedPlate);
        }

        if (vehicleRepository.existsByVinAndIdNot(normalizedVin, id)) {
            throw new BusinessException("Ya existe otro vehículo registrado con el VIN: " + normalizedVin);
        }

        vehicleMapper.updateEntityFromDto(vehicle, requestDto, customer);
        Vehicle updatedVehicle = vehicleRepository.save(vehicle);
        log.info("Vehículo con ID: {} actualizado exitosamente", id);

        return vehicleMapper.toResponseDto(updatedVehicle);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info("Eliminando vehículo con ID: {}", id);
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", "id", id));

        vehicleRepository.delete(vehicle);
        log.info("Vehículo con ID: {} eliminado", id);
    }
}