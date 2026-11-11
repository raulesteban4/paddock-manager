package com.paddock.manager.modules.part.service;

import com.paddock.manager.modules.part.dto.InventoryStatsDto;
import com.paddock.manager.modules.part.dto.PartRequestDto;
import com.paddock.manager.modules.part.dto.PartResponseDto;
import com.paddock.manager.modules.part.dto.StockAdjustmentDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PartService {

    /**
     * Da de alta un nuevo repuesto en el catálogo con validación de código único.
     */
    PartResponseDto create(PartRequestDto dto);

    /**
     * Actualiza la ficha de un repuesto existente.
     */
    PartResponseDto update(Long id, PartRequestDto dto);

    /**
     * Obtiene la ficha de un repuesto por su ID.
     */
    PartResponseDto getById(Long id);

    /**
     * Obtiene un repuesto por su código de referencia único.
     */
    PartResponseDto getByReferenceCode(String referenceCode);

    /**
     * Lista piezas con soporte para búsqueda libre y filtro de stock bajo.
     */
    Page<PartResponseDto> findAll(String search, Boolean lowStockOnly, Pageable pageable);

    /**
     * Ajusta el stock de un repuesto sumando o restando unidades (previene stock negativo).
     */
    PartResponseDto adjustStock(Long id, StockAdjustmentDto dto);

    /**
     * Elimina un repuesto del inventario.
     */
    void delete(Long id);

    /**
     * Obtiene estadísticas agregadas de valoración y estado del almacén.
     */
    InventoryStatsDto getInventoryStats();
}

