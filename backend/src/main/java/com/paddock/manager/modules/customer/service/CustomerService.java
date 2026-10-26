package com.paddock.manager.modules.customer.service;

import com.paddock.manager.modules.customer.dto.CustomerRequestDto;
import com.paddock.manager.modules.customer.dto.CustomerResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CustomerService {

    Page<CustomerResponseDto> findAll(String search, Pageable pageable);

    CustomerResponseDto findById(Long id);

    CustomerResponseDto findByDniCif(String dniCif);

    CustomerResponseDto create(CustomerRequestDto requestDto);

    CustomerResponseDto update(Long id, CustomerRequestDto requestDto);

    void delete(Long id);
}