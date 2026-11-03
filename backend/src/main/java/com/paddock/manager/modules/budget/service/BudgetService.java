package com.paddock.manager.modules.budget.service;

import com.paddock.manager.modules.budget.dto.BudgetRequestDto;
import com.paddock.manager.modules.budget.dto.BudgetResponseDto;
import com.paddock.manager.modules.budget.dto.BudgetStatusChangeDto;
import com.paddock.manager.modules.budget.entity.BudgetStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BudgetService {

    /**
     * Crea un nuevo presupuesto asociado a una orden de reparación.
     * Calcula automáticamente subtotales, IVA (21%) y total.
     * Si la orden está en estado DIAGNOSIS, la avanza automáticamente a QUOTE_PENDING.
     */
    BudgetResponseDto create(BudgetRequestDto dto, String userEmail);

    /**
     * Actualiza las líneas y notas de un presupuesto existente en estado PENDING.
     */
    BudgetResponseDto update(Long id, BudgetRequestDto dto);

    /**
     * Obtiene un presupuesto por su ID.
     */
    BudgetResponseDto getById(Long id);

    /**
     * Obtiene el presupuesto vinculado a una orden de reparación.
     */
    BudgetResponseDto getByRepairOrderId(Long repairOrderId);

    /**
     * Obtiene el presupuesto por número de orden (ej: ORD-2026-0001).
     */
    BudgetResponseDto getByOrderNumber(String orderNumber);

    /**
     * Lista presupuestos con filtrado opcional y paginación.
     */
    Page<BudgetResponseDto> findAll(BudgetStatus status, String search, Pageable pageable);

    /**
     * Cambia el estado del presupuesto (APPROVED o REJECTED).
     * Al aprobarlo, sincroniza la Orden de Reparación avanzando su estado a APPROVED.
     */
    BudgetResponseDto changeStatus(Long id, BudgetStatusChangeDto dto, String userEmail);

    /**
     * Elimina un presupuesto. Solo permitido si no está en estado APPROVED.
     */
    void delete(Long id);
}

