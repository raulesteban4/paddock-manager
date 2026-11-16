package com.paddock.manager.modules.budget.service;

import com.paddock.manager.common.exception.BusinessException;
import com.paddock.manager.common.exception.ResourceNotFoundException;
import com.paddock.manager.modules.budget.dto.BudgetItemRequestDto;
import com.paddock.manager.modules.budget.dto.BudgetRequestDto;
import com.paddock.manager.modules.budget.dto.BudgetResponseDto;
import com.paddock.manager.modules.budget.dto.BudgetStatusChangeDto;
import com.paddock.manager.modules.budget.entity.Budget;
import com.paddock.manager.modules.budget.entity.BudgetItem;
import com.paddock.manager.modules.budget.entity.BudgetItemType;
import com.paddock.manager.modules.budget.entity.BudgetStatus;
import com.paddock.manager.modules.budget.mapper.BudgetMapper;
import com.paddock.manager.modules.budget.repository.BudgetRepository;
import com.paddock.manager.modules.customer.entity.Customer;
import com.paddock.manager.modules.repairorder.dto.StatusChangeRequestDto;
import com.paddock.manager.modules.repairorder.entity.RepairOrder;
import com.paddock.manager.modules.repairorder.entity.RepairOrderStatus;
import com.paddock.manager.modules.repairorder.repository.RepairOrderRepository;
import com.paddock.manager.modules.repairorder.service.RepairOrderService;
import com.paddock.manager.modules.vehicle.entity.Vehicle;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BudgetServiceImpl - Tests Unitarios con Mockito")
class BudgetServiceImplTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private RepairOrderRepository repairOrderRepository;

    @Mock
    private RepairOrderService repairOrderService;

    @Spy
    private BudgetMapper budgetMapper = new BudgetMapper();

    @InjectMocks
    private BudgetServiceImpl budgetService;

    private Customer testCustomer;
    private Vehicle testVehicle;
    private RepairOrder testRepairOrder;

    @BeforeEach
    void setUp() {
        testCustomer = Customer.builder()
                .id(1L)
                .firstName("Carlos")
                .lastName("Sainz")
                .email("carlos@paddock.es")
                .phone("600112233")
                .build();

        testVehicle = Vehicle.builder()
                .id(1L)
                .brand("Ferrari")
                .model("488 Pista")
                .licensePlate("5555-FXX")
                .customer(testCustomer)
                .build();

        testRepairOrder = RepairOrder.builder()
                .id(10L)
                .orderNumber("ORD-2026-0001")
                .customer(testCustomer)
                .vehicle(testVehicle)
                .status(RepairOrderStatus.DIAGNOSIS)
                .entryDate(ZonedDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Debe calcular subtotal, IVA 21% y total correctamente al crear presupuesto")
    void create_shouldCalculateTotalsAndAdvanceOrderToQuotePending() {
        // Arrange
        when(repairOrderRepository.findById(10L)).thenReturn(Optional.of(testRepairOrder));
        when(budgetRepository.existsByRepairOrderId(10L)).thenReturn(false);

        List<BudgetItemRequestDto> items = List.of(
                BudgetItemRequestDto.builder()
                        .itemType(BudgetItemType.LABOR)
                        .description("Mano de obra diagnosis y desmontaje")
                        .quantity(new BigDecimal("2.00"))
                        .unitPrice(new BigDecimal("60.00"))
                        .build(),
                BudgetItemRequestDto.builder()
                        .itemType(BudgetItemType.PART)
                        .description("Pastillas de freno Brembo")
                        .quantity(new BigDecimal("1.00"))
                        .unitPrice(new BigDecimal("80.00"))
                        .build()
        );

        BudgetRequestDto request = BudgetRequestDto.builder()
                .repairOrderId(10L)
                .taxRate(new BigDecimal("21.00"))
                .customerNotes("Revisar también discos")
                .items(items)
                .build();

        when(budgetRepository.save(any(Budget.class))).thenAnswer(invocation -> {
            Budget b = invocation.getArgument(0);
            b.setId(100L);
            return b;
        });

        // Act
        BudgetResponseDto response = budgetService.create(request, "admin@paddock.com");

        // Assert
        assertThat(response).isNotNull();
        // Subtotal: (2 * 60) + (1 * 80) = 120 + 80 = 200.00
        assertThat(response.getSubtotal()).isEqualByComparingTo(new BigDecimal("200.00"));
        // Tax 21%: 200 * 0.21 = 42.00
        assertThat(response.getTaxAmount()).isEqualByComparingTo(new BigDecimal("42.00"));
        // Total: 200 + 42 = 242.00
        assertThat(response.getTotal()).isEqualByComparingTo(new BigDecimal("242.00"));
        assertThat(response.getStatus()).isEqualTo(BudgetStatus.PENDING);

        // Verifica que la orden avanzó de DIAGNOSIS a QUOTE_PENDING
        verify(repairOrderService).changeStatus(eq(10L), any(StatusChangeRequestDto.class), eq("admin@paddock.com"));
    }

    @Test
    @DisplayName("Debe lanzar BusinessException al intentar crear presupuesto para una orden cerrada")
    void create_shouldThrowBusinessException_whenOrderIsDeliveredOrCancelled() {
        testRepairOrder.setStatus(RepairOrderStatus.DELIVERED);
        when(repairOrderRepository.findById(10L)).thenReturn(Optional.of(testRepairOrder));

        BudgetRequestDto request = BudgetRequestDto.builder()
                .repairOrderId(10L)
                .items(List.of())
                .build();

        assertThatThrownBy(() -> budgetService.create(request, "admin@paddock.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("No se puede generar un presupuesto para una orden en estado: DELIVERED");

        verify(budgetRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe lanzar BusinessException si ya existe un presupuesto para la orden")
    void create_shouldThrowBusinessException_whenBudgetAlreadyExistsForOrder() {
        when(repairOrderRepository.findById(10L)).thenReturn(Optional.of(testRepairOrder));
        when(budgetRepository.existsByRepairOrderId(10L)).thenReturn(true);

        BudgetRequestDto request = BudgetRequestDto.builder()
                .repairOrderId(10L)
                .items(List.of())
                .build();

        assertThatThrownBy(() -> budgetService.create(request, "admin@paddock.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Ya existe un presupuesto para la orden");

        verify(budgetRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe lanzar BusinessException al intentar modificar un presupuesto ya APROBADO")
    void update_shouldThrowBusinessException_whenBudgetIsAlreadyApproved() {
        Budget approvedBudget = Budget.builder()
                .id(50L)
                .repairOrder(testRepairOrder)
                .status(BudgetStatus.APPROVED)
                .items(new ArrayList<>())
                .build();

        when(budgetRepository.findByIdWithDetails(50L)).thenReturn(Optional.of(approvedBudget));

        BudgetRequestDto updateDto = BudgetRequestDto.builder()
                .repairOrderId(10L)
                .items(List.of())
                .build();

        assertThatThrownBy(() -> budgetService.update(50L, updateDto))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("APROBADO");

        verify(budgetRepository, never()).save(any());
    }

    @Test
    @DisplayName("Al aprobar presupuesto, debe sincronizar la orden a APPROVED")
    void changeStatus_shouldAdvanceRepairOrderToApproved_whenBudgetIsApproved() {
        testRepairOrder.setStatus(RepairOrderStatus.QUOTE_PENDING);

        Budget budget = Budget.builder()
                .id(60L)
                .repairOrder(testRepairOrder)
                .status(BudgetStatus.PENDING)
                .total(new BigDecimal("350.00"))
                .items(new ArrayList<>())
                .build();

        when(budgetRepository.findByIdWithDetails(60L)).thenReturn(Optional.of(budget));
        when(budgetRepository.save(any(Budget.class))).thenAnswer(i -> i.getArgument(0));

        BudgetStatusChangeDto statusDto = BudgetStatusChangeDto.builder()
                .newStatus(BudgetStatus.APPROVED)
                .notes("Aprobado telefónicamente")
                .build();

        BudgetResponseDto response = budgetService.changeStatus(60L, statusDto, "admin@paddock.com");

        assertThat(response.getStatus()).isEqualTo(BudgetStatus.APPROVED);
        ArgumentCaptor<StatusChangeRequestDto> captor = ArgumentCaptor.forClass(StatusChangeRequestDto.class);
        verify(repairOrderService).changeStatus(eq(10L), captor.capture(), eq("admin@paddock.com"));
        assertThat(captor.getValue().getNewStatus()).isEqualTo(RepairOrderStatus.APPROVED);
    }

    @Test
    @DisplayName("Debe lanzar BusinessException si se intenta eliminar un presupuesto APROBADO")
    void delete_shouldThrowBusinessException_whenBudgetIsApproved() {
        Budget approved = Budget.builder()
                .id(70L)
                .status(BudgetStatus.APPROVED)
                .build();

        when(budgetRepository.findByIdWithDetails(70L)).thenReturn(Optional.of(approved));

        assertThatThrownBy(() -> budgetService.delete(70L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("No se puede eliminar un presupuesto en estado APROBADO");

        verify(budgetRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Debe eliminar un presupuesto en estado PENDING")
    void delete_shouldDeleteBudget_whenBudgetIsPending() {
        Budget pending = Budget.builder()
                .id(71L)
                .status(BudgetStatus.PENDING)
                .build();

        when(budgetRepository.findByIdWithDetails(71L)).thenReturn(Optional.of(pending));

        budgetService.delete(71L);

        verify(budgetRepository).delete(pending);
    }
}
