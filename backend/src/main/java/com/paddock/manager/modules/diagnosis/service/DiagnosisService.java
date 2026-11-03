package com.paddock.manager.modules.diagnosis.service;

import com.paddock.manager.modules.diagnosis.dto.DiagnosisRequestDto;
import com.paddock.manager.modules.diagnosis.dto.DiagnosisResponseDto;

public interface DiagnosisService {

    /**
     * Crea un diagnóstico para una orden de reparación.
     * La orden debe estar en estado DIAGNOSIS o superior.
     * Solo puede existir un diagnóstico por orden.
     */
    DiagnosisResponseDto create(DiagnosisRequestDto dto);

    /**
     * Actualiza un diagnóstico existente por su ID.
     */
    DiagnosisResponseDto update(Long id, DiagnosisRequestDto dto);

    /**
     * Obtiene el diagnóstico de una orden de reparación por ID de orden.
     */
    DiagnosisResponseDto getByRepairOrderId(Long repairOrderId);

    /**
     * Obtiene el diagnóstico de una orden por número de orden (ej: ORD-2026-0001).
     */
    DiagnosisResponseDto getByOrderNumber(String orderNumber);

    /**
     * Obtiene un diagnóstico por su ID.
     */
    DiagnosisResponseDto getById(Long id);

    /**
     * Elimina un diagnóstico. Solo permitido si la OR está en estado DIAGNOSIS o QUOTE_PENDING.
     */
    void delete(Long id);
}

