package com.paddock.manager.modules.budget.service;

import com.paddock.manager.common.exception.BusinessException;
import com.paddock.manager.common.exception.ResourceNotFoundException;
import com.paddock.manager.modules.budget.dto.BudgetItemRequestDto;
import com.paddock.manager.modules.budget.dto.BudgetRequestDto;
import com.paddock.manager.modules.budget.dto.BudgetResponseDto;
import com.paddock.manager.modules.budget.dto.BudgetStatusChangeDto;
import com.paddock.manager.modules.budget.entity.Budget;
import com.paddock.manager.modules.budget.entity.BudgetItem;
import com.paddock.manager.modules.budget.entity.BudgetStatus;
import com.paddock.manager.modules.budget.mapper.BudgetMapper;
import com.paddock.manager.modules.budget.repository.BudgetRepository;
import com.paddock.manager.modules.repairorder.dto.StatusChangeRequestDto;
import com.paddock.manager.modules.repairorder.entity.RepairOrder;
import com.paddock.manager.modules.repairorder.entity.RepairOrderStatus;
import com.paddock.manager.modules.repairorder.repository.RepairOrderRepository;
import com.paddock.manager.modules.repairorder.service.RepairOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BudgetServiceImpl implements BudgetService {

    private static final BigDecimal DEFAULT_TAX_RATE = new BigDecimal("21.00");

    private final BudgetRepository budgetRepository;
    private final RepairOrderRepository repairOrderRepository;
    private final RepairOrderService repairOrderService;
    private final BudgetMapper budgetMapper;

    @Override
    @Transactional
    public BudgetResponseDto create(BudgetRequestDto dto, String userEmail) {
        log.info("Creando presupuesto para orden de reparación ID: {}", dto.getRepairOrderId());

        RepairOrder repairOrder = repairOrderRepository.findById(dto.getRepairOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Orden de reparación", "id", dto.getRepairOrderId()));

        // Regla: No se permite crear presupuesto si la orden ya está cerrada
        if (repairOrder.getStatus() == RepairOrderStatus.DELIVERED ||
            repairOrder.getStatus() == RepairOrderStatus.CANCELLED) {
            throw new BusinessException(
                    "No se puede generar un presupuesto para una orden en estado: " + repairOrder.getStatus());
        }

        // Regla: 1:1 estricto con la orden de reparación
        if (budgetRepository.existsByRepairOrderId(dto.getRepairOrderId())) {
            throw new BusinessException(
                    "Ya existe un presupuesto para la orden " + repairOrder.getOrderNumber() +
                    ". Modifique el existente o elimínelo si está en borrador.");
        }

        Budget budget = Budget.builder()
                .repairOrder(repairOrder)
                .status(BudgetStatus.PENDING)
                .taxRate(dto.getTaxRate() != null ? dto.getTaxRate() : DEFAULT_TAX_RATE)
                .customerNotes(dto.getCustomerNotes())
                .items(new ArrayList<>())
                .build();

        populateAndCalculateTotals(budget, dto.getItems());

        Budget saved = budgetRepository.save(budget);
        log.info("Presupuesto ID: {} guardado con total: {} €", saved.getId(), saved.getTotal());

        // Si la orden estaba en DIAGNOSIS, la avanzamos a QUOTE_PENDING
        if (repairOrder.getStatus() == RepairOrderStatus.DIAGNOSIS) {
            log.info("Avanzando orden {} a QUOTE_PENDING al crearse el presupuesto", repairOrder.getOrderNumber());
            StatusChangeRequestDto statusChange = StatusChangeRequestDto.builder()
                    .newStatus(RepairOrderStatus.QUOTE_PENDING)
                    .notes("Presupuesto emitido por valor de " + saved.getTotal() + " €")
                    .build();
            repairOrderService.changeStatus(repairOrder.getId(), statusChange, userEmail);
        }

        return budgetMapper.toResponseDto(saved);
    }

    @Override
    @Transactional
    public BudgetResponseDto update(Long id, BudgetRequestDto dto) {
        log.info("Actualizando presupuesto ID: {}", id);

        Budget budget = findBudgetOrThrow(id);

        if (budget.getStatus() == BudgetStatus.APPROVED) {
            throw new BusinessException(
                    "No se puede modificar un presupuesto que ya ha sido APROBADO por el cliente.");
        }

        budget.setTaxRate(dto.getTaxRate() != null ? dto.getTaxRate() : DEFAULT_TAX_RATE);
        budget.setCustomerNotes(dto.getCustomerNotes());
        budget.clearItems();

        populateAndCalculateTotals(budget, dto.getItems());

        Budget updated = budgetRepository.save(budget);
        log.info("Presupuesto ID: {} actualizado con nuevo total: {} €", updated.getId(), updated.getTotal());
        return budgetMapper.toResponseDto(updated);
    }

    @Override
    public BudgetResponseDto getById(Long id) {
        return budgetMapper.toResponseDto(findBudgetOrThrow(id));
    }

    @Override
    public BudgetResponseDto getByRepairOrderId(Long repairOrderId) {
        Budget budget = budgetRepository.findByRepairOrderId(repairOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Presupuesto", "repairOrderId", repairOrderId));
        return budgetMapper.toResponseDto(budget);
    }

    @Override
    public BudgetResponseDto getByOrderNumber(String orderNumber) {
        Budget budget = budgetRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Presupuesto", "orderNumber", orderNumber));
        return budgetMapper.toResponseDto(budget);
    }

    @Override
    public Page<BudgetResponseDto> findAll(BudgetStatus status, String search, Pageable pageable) {
        boolean hasSearch = (search != null && !search.trim().isEmpty());
        String pattern = hasSearch ? "%" + search.trim().toLowerCase() + "%" : null;

        Page<Budget> page;
        if (hasSearch && status != null) {
            page = budgetRepository.searchBudgetsWithStatus(status, pattern, pageable);
        } else if (hasSearch) {
            page = budgetRepository.searchBudgets(pattern, pageable);
        } else if (status != null) {
            page = budgetRepository.findByStatus(status, pageable);
        } else {
            page = budgetRepository.findAll(pageable);
        }

        return page.map(budgetMapper::toResponseDto);
    }

    @Override
    @Transactional
    public BudgetResponseDto changeStatus(Long id, BudgetStatusChangeDto dto, String userEmail) {
        log.info("Cambiando estado de presupuesto ID: {} a {}", id, dto.getNewStatus());

        Budget budget = findBudgetOrThrow(id);

        if (budget.getStatus() == BudgetStatus.APPROVED && dto.getNewStatus() == BudgetStatus.APPROVED) {
            throw new BusinessException("El presupuesto ya se encuentra aprobado.");
        }

        budget.setStatus(dto.getNewStatus());
        Budget updated = budgetRepository.save(budget);

        RepairOrder repairOrder = updated.getRepairOrder();

        // Si se aprueba el presupuesto, sincronizamos la orden a APPROVED si está en QUOTE_PENDING
        if (dto.getNewStatus() == BudgetStatus.APPROVED) {
            if (repairOrder.getStatus() == RepairOrderStatus.QUOTE_PENDING) {
                log.info("Avanzando orden {} a APPROVED al ser aceptado el presupuesto", repairOrder.getOrderNumber());
                StatusChangeRequestDto statusChange = StatusChangeRequestDto.builder()
                        .newStatus(RepairOrderStatus.APPROVED)
                        .notes(dto.getNotes() != null && !dto.getNotes().isBlank()
                                ? dto.getNotes()
                                : "Presupuesto de " + updated.getTotal() + " € aprobado por el cliente")
                        .build();
                repairOrderService.changeStatus(repairOrder.getId(), statusChange, userEmail);
            }
        }

        return budgetMapper.toResponseDto(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info("Eliminando presupuesto ID: {}", id);

        Budget budget = findBudgetOrThrow(id);

        if (budget.getStatus() == BudgetStatus.APPROVED) {
            throw new BusinessException(
                    "No se puede eliminar un presupuesto en estado APROBADO.");
        }

        budgetRepository.delete(budget);
        log.info("Presupuesto ID: {} eliminado", id);
    }

    // ── Métodos auxiliares de cálculo y validación ──────────────────────────────

    private Budget findBudgetOrThrow(Long id) {
        return budgetRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Presupuesto", "id", id));
    }

    private void populateAndCalculateTotals(Budget budget, List<BudgetItemRequestDto> itemsDto) {
        BigDecimal subtotal = BigDecimal.ZERO;

        for (BudgetItemRequestDto itemDto : itemsDto) {
            BigDecimal lineTotal = itemDto.getQuantity()
                    .multiply(itemDto.getUnitPrice())
                    .setScale(2, RoundingMode.HALF_UP);

            BudgetItem item = BudgetItem.builder()
                    .budget(budget)
                    .itemType(itemDto.getItemType())
                    .description(itemDto.getDescription())
                    .quantity(itemDto.getQuantity().setScale(2, RoundingMode.HALF_UP))
                    .unitPrice(itemDto.getUnitPrice().setScale(2, RoundingMode.HALF_UP))
                    .total(lineTotal)
                    .build();

            budget.addItem(item);
            subtotal = subtotal.add(lineTotal);
        }

        BigDecimal taxRate = budget.getTaxRate() != null ? budget.getTaxRate() : DEFAULT_TAX_RATE;
        BigDecimal taxAmount = subtotal.multiply(taxRate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(taxAmount);

        budget.setSubtotal(subtotal);
        budget.setTaxRate(taxRate);
        budget.setTaxAmount(taxAmount);
        budget.setTotal(total);
    }
}

