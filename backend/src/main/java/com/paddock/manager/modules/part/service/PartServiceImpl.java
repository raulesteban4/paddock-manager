package com.paddock.manager.modules.part.service;

import com.paddock.manager.common.exception.BusinessException;
import com.paddock.manager.common.exception.ResourceNotFoundException;
import com.paddock.manager.modules.part.dto.InventoryStatsDto;
import com.paddock.manager.modules.part.dto.PartRequestDto;
import com.paddock.manager.modules.part.dto.PartResponseDto;
import com.paddock.manager.modules.part.dto.StockAdjustmentDto;
import com.paddock.manager.modules.part.entity.Part;
import com.paddock.manager.modules.part.mapper.PartMapper;
import com.paddock.manager.modules.part.repository.PartRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PartServiceImpl implements PartService {

    private final PartRepository partRepository;
    private final PartMapper partMapper;

    @Override
    @Transactional
    public PartResponseDto create(PartRequestDto dto) {
        String cleanRef = dto.getReferenceCode().trim().toUpperCase();
        log.info("Creando nuevo repuesto con referencia: {}", cleanRef);

        if (partRepository.existsByReferenceCodeIgnoreCase(cleanRef)) {
            throw new BusinessException("Ya existe un repuesto registrado con la referencia: " + cleanRef);
        }

        Part part = partMapper.toEntity(dto);
        Part saved = partRepository.save(part);
        log.info("Repuesto registrado con ID: {} y referencia: {}", saved.getId(), saved.getReferenceCode());
        return partMapper.toResponseDto(saved);
    }

    @Override
    @Transactional
    public PartResponseDto update(Long id, PartRequestDto dto) {
        log.info("Actualizando repuesto ID: {}", id);

        Part part = findPartOrThrow(id);
        String cleanRef = dto.getReferenceCode().trim().toUpperCase();

        if (!part.getReferenceCode().equalsIgnoreCase(cleanRef) &&
            partRepository.existsByReferenceCodeIgnoreCase(cleanRef)) {
            throw new BusinessException("Ya existe otro repuesto con la referencia: " + cleanRef);
        }

        partMapper.updateEntityFromDto(part, dto);
        Part updated = partRepository.save(part);
        log.info("Repuesto ID: {} actualizado exitosamente", updated.getId());
        return partMapper.toResponseDto(updated);
    }

    @Override
    public PartResponseDto getById(Long id) {
        return partMapper.toResponseDto(findPartOrThrow(id));
    }

    @Override
    public PartResponseDto getByReferenceCode(String referenceCode) {
        Part part = partRepository.findByReferenceCodeIgnoreCase(referenceCode.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Repuesto", "referenceCode", referenceCode));
        return partMapper.toResponseDto(part);
    }

    @Override
    public Page<PartResponseDto> findAll(String search, Boolean lowStockOnly, Pageable pageable) {
        boolean hasSearch = (search != null && !search.trim().isEmpty());
        boolean filterLow = Boolean.TRUE.equals(lowStockOnly);
        String pattern = hasSearch ? "%" + search.trim().toLowerCase() + "%" : null;

        Page<Part> page;
        if (hasSearch && filterLow) {
            page = partRepository.searchLowStockParts(pattern, pageable);
        } else if (hasSearch) {
            page = partRepository.searchParts(pattern, pageable);
        } else if (filterLow) {
            page = partRepository.findLowStockParts(pageable);
        } else {
            page = partRepository.findAll(pageable);
        }

        return page.map(partMapper::toResponseDto);
    }

    @Override
    @Transactional
    public PartResponseDto adjustStock(Long id, StockAdjustmentDto dto) {
        log.info("Ajustando stock para repuesto ID: {} (variación: {})", id, dto.getQuantityDelta());

        Part part = findPartOrThrow(id);
        int currentStock = part.getStock() != null ? part.getStock() : 0;
        int newStock = currentStock + dto.getQuantityDelta();

        if (newStock < 0) {
            throw new BusinessException(
                    "Operación rechazada: el stock resultante no puede ser negativo (" + newStock + " unidades). " +
                    "Stock actual disponible: " + currentStock);
        }

        part.setStock(newStock);
        Part updated = partRepository.save(part);
        log.info("Stock de repuesto {} actualizado: {} -> {} unidades (motivo: {})",
                part.getReferenceCode(), currentStock, newStock, dto.getReason());
        return partMapper.toResponseDto(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info("Eliminando repuesto ID: {}", id);

        Part part = findPartOrThrow(id);
        partRepository.delete(part);
        log.info("Repuesto ID: {} eliminado", id);
    }

    @Override
    public InventoryStatsDto getInventoryStats() {
        List<Part> allParts = partRepository.findAll();

        long totalParts = allParts.size();
        long lowStockCount = 0;
        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalRetail = BigDecimal.ZERO;

        for (Part p : allParts) {
            if (p.isLowStock()) {
                lowStockCount++;
            }
            int stock = (p.getStock() != null) ? p.getStock() : 0;
            BigDecimal qty = new BigDecimal(stock);

            if (p.getCostPrice() != null) {
                totalCost = totalCost.add(p.getCostPrice().multiply(qty));
            }
            if (p.getUnitPrice() != null) {
                totalRetail = totalRetail.add(p.getUnitPrice().multiply(qty));
            }
        }

        return InventoryStatsDto.builder()
                .totalParts(totalParts)
                .lowStockCount(lowStockCount)
                .totalCostValue(totalCost)
                .totalRetailValue(totalRetail)
                .build();
    }

    private Part findPartOrThrow(Long id) {
        return partRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Repuesto", "id", id));
    }
}

