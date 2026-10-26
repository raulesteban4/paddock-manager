package com.paddock.manager.modules.customer.service;

import com.paddock.manager.common.exception.BusinessException;
import com.paddock.manager.common.exception.ResourceNotFoundException;
import com.paddock.manager.modules.customer.dto.CustomerRequestDto;
import com.paddock.manager.modules.customer.dto.CustomerResponseDto;
import com.paddock.manager.modules.customer.entity.Customer;
import com.paddock.manager.modules.customer.mapper.CustomerMapper;
import com.paddock.manager.modules.customer.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerResponseDto> findAll(String search, Pageable pageable) {
        log.debug("Listando clientes con filtro de búsqueda: '{}', página: {}", search, pageable.getPageNumber());
        Page<Customer> customers;
        if (search != null && !search.trim().isEmpty()) {
            customers = customerRepository.searchCustomers(search.trim(), pageable);
        } else {
            customers = customerRepository.findAll(pageable);
        }
        return customers.map(customerMapper::toResponseDto);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponseDto findById(Long id) {
        log.debug("Buscando cliente por ID: {}", id);
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", id));
        return customerMapper.toResponseDto(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponseDto findByDniCif(String dniCif) {
        log.debug("Buscando cliente por DNI/CIF: {}", dniCif);
        Customer customer = customerRepository.findByDniCif(dniCif.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "dniCif", dniCif));
        return customerMapper.toResponseDto(customer);
    }

    @Override
    @Transactional
    public CustomerResponseDto create(CustomerRequestDto requestDto) {
        String normalizedDni = requestDto.getDniCif().trim().toUpperCase();
        String normalizedEmail = requestDto.getEmail().trim().toLowerCase();

        log.info("Creando nuevo cliente con DNI/CIF: {}", normalizedDni);

        if (customerRepository.existsByDniCif(normalizedDni)) {
            throw new BusinessException("Ya existe un cliente registrado con el DNI/CIF: " + normalizedDni);
        }

        if (customerRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException("Ya existe un cliente registrado con el email: " + normalizedEmail);
        }

        Customer customer = customerMapper.toEntity(requestDto);
        Customer savedCustomer = customerRepository.save(customer);
        log.info("Cliente creado exitosamente con ID: {}", savedCustomer.getId());

        return customerMapper.toResponseDto(savedCustomer);
    }

    @Override
    @Transactional
    public CustomerResponseDto update(Long id, CustomerRequestDto requestDto) {
        log.info("Actualizando cliente con ID: {}", id);

        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", id));

        String normalizedDni = requestDto.getDniCif().trim().toUpperCase();
        String normalizedEmail = requestDto.getEmail().trim().toLowerCase();

        if (customerRepository.existsByDniCifAndIdNot(normalizedDni, id)) {
            throw new BusinessException("Ya existe otro cliente con el DNI/CIF: " + normalizedDni);
        }

        if (customerRepository.existsByEmailAndIdNot(normalizedEmail, id)) {
            throw new BusinessException("Ya existe otro cliente con el email: " + normalizedEmail);
        }

        customerMapper.updateEntityFromDto(customer, requestDto);
        Customer updatedCustomer = customerRepository.save(customer);
        log.info("Cliente con ID: {} actualizado exitosamente", id);

        return customerMapper.toResponseDto(updatedCustomer);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info("Eliminando cliente con ID: {}", id);
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", id));

        customerRepository.delete(customer);
        log.info("Cliente con ID: {} eliminado", id);
    }
}