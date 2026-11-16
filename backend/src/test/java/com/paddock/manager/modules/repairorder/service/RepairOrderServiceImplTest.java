package com.paddock.manager.modules.repairorder.service;

import com.paddock.manager.common.exception.BusinessException;
import com.paddock.manager.common.exception.ResourceNotFoundException;
import com.paddock.manager.modules.customer.entity.Customer;
import com.paddock.manager.modules.customer.repository.CustomerRepository;
import com.paddock.manager.modules.repairorder.dto.RepairOrderRequestDto;
import com.paddock.manager.modules.repairorder.dto.RepairOrderResponseDto;
import com.paddock.manager.modules.repairorder.dto.StatusChangeRequestDto;
import com.paddock.manager.modules.repairorder.entity.RepairOrder;
import com.paddock.manager.modules.repairorder.entity.RepairOrderPriority;
import com.paddock.manager.modules.repairorder.entity.RepairOrderStatus;
import com.paddock.manager.modules.repairorder.entity.StatusHistory;
import com.paddock.manager.modules.repairorder.mapper.RepairOrderMapper;
import com.paddock.manager.modules.repairorder.repository.RepairOrderRepository;
import com.paddock.manager.modules.repairorder.repository.StatusHistoryRepository;
import com.paddock.manager.modules.user.entity.Role;
import com.paddock.manager.modules.user.entity.User;
import com.paddock.manager.modules.user.repository.UserRepository;
import com.paddock.manager.modules.vehicle.entity.Vehicle;
import com.paddock.manager.modules.vehicle.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RepairOrderServiceImpl - Tests Unitarios con Mockito")
class RepairOrderServiceImplTest {

    @Mock
    private RepairOrderRepository repairOrderRepository;

    @Mock
    private StatusHistoryRepository statusHistoryRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private UserRepository userRepository;

    @Spy
    private RepairOrderMapper mapper = new RepairOrderMapper();

    @InjectMocks
    private RepairOrderServiceImpl repairOrderService;

    private Customer testCustomer;
    private Vehicle testVehicle;
    private User testMechanic;

    @BeforeEach
    void setUp() {
        testCustomer = Customer.builder()
                .id(1L)
                .firstName("Fernando")
                .lastName("Alonso")
                .dniCif("12345678A")
                .phone("611223344")
                .build();

        testVehicle = Vehicle.builder()
                .id(1L)
                .brand("Aston Martin")
                .model("Vantage")
                .licensePlate("1414-FA")
                .year(2023)
                .mileage(12000)
                .customer(testCustomer)
                .build();

        Role mechanicRole = Role.builder().id(3).name("ROLE_MECHANIC").build();
        testMechanic = User.builder()
                .id(5L)
                .email("pedro@paddock.es")
                .firstName("Pedro")
                .lastName("de la Rosa")
                .role(mechanicRole)
                .build();
    }

    @Test
    @DisplayName("Debe crear orden de reparación, generar código ORD-YYYY-0001 y actualizar kilometraje si es mayor")
    void create_shouldGenerateOrderNumberAndUpdateMileage() {
        RepairOrderRequestDto request = RepairOrderRequestDto.builder()
                .customerId(1L)
                .vehicleId(1L)
                .mechanicId(5L)
                .mileageAtEntry(15000) // Mayor que 12000
                .customerIssue("Ruido al frenar")
                .priority(RepairOrderPriority.HIGH)
                .build();

        when(customerRepository.findById(1L)).thenReturn(Optional.of(testCustomer));
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(testVehicle));
        when(userRepository.findById(5L)).thenReturn(Optional.of(testMechanic));
        when(repairOrderRepository.findLastOrderNumberWithPrefix(anyString())).thenReturn(Optional.empty());

        when(repairOrderRepository.save(any(RepairOrder.class))).thenAnswer(i -> {
            RepairOrder ro = i.getArgument(0);
            ro.setId(100L);
            return ro;
        });

        RepairOrderResponseDto response = repairOrderService.create(request);

        assertThat(response).isNotNull();
        int currentYear = LocalDate.now().getYear();
        assertThat(response.getOrderNumber()).isEqualTo("ORD-" + currentYear + "-0001");
        assertThat(response.getStatus()).isEqualTo(RepairOrderStatus.RECEIVED);
        assertThat(testVehicle.getMileage()).isEqualTo(15000);

        verify(vehicleRepository).save(testVehicle);
        verify(statusHistoryRepository).save(any(StatusHistory.class));
    }

    @Test
    @DisplayName("Debe lanzar BusinessException si el vehículo no pertenece al cliente")
    void create_shouldThrowBusinessException_whenVehicleDoesNotBelongToCustomer() {
        Customer otherCustomer = Customer.builder().id(99L).firstName("Otro").build();
        Vehicle otherVehicle = Vehicle.builder()
                .id(2L)
                .licensePlate("9999-ZZZ")
                .customer(otherCustomer)
                .build();

        RepairOrderRequestDto request = RepairOrderRequestDto.builder()
                .customerId(1L)
                .vehicleId(2L)
                .build();

        when(customerRepository.findById(1L)).thenReturn(Optional.of(testCustomer));
        when(vehicleRepository.findById(2L)).thenReturn(Optional.of(otherVehicle));

        assertThatThrownBy(() -> repairOrderService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("no pertenece al cliente seleccionado");

        verify(repairOrderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe permitir transición de estado válida RECEIVED -> DIAGNOSIS y registrar historial")
    void changeStatus_shouldAdvanceStatus_whenTransitionIsValid() {
        RepairOrder order = RepairOrder.builder()
                .id(10L)
                .orderNumber("ORD-2026-0001")
                .customer(testCustomer)
                .vehicle(testVehicle)
                .status(RepairOrderStatus.RECEIVED)
                .build();

        when(repairOrderRepository.findByIdWithDetails(10L)).thenReturn(Optional.of(order));
        when(repairOrderRepository.save(any(RepairOrder.class))).thenAnswer(i -> i.getArgument(0));

        StatusChangeRequestDto changeDto = StatusChangeRequestDto.builder()
                .newStatus(RepairOrderStatus.DIAGNOSIS)
                .notes("Vehículo subido al elevador")
                .build();

        RepairOrderResponseDto response = repairOrderService.changeStatus(10L, changeDto, "admin@paddock.es");

        assertThat(response.getStatus()).isEqualTo(RepairOrderStatus.DIAGNOSIS);
        verify(statusHistoryRepository).save(any(StatusHistory.class));
    }

    @Test
    @DisplayName("Debe rechazar transición de estado no válida (p.ej. RECEIVED -> COMPLETED)")
    void changeStatus_shouldThrowBusinessException_whenTransitionIsInvalid() {
        RepairOrder order = RepairOrder.builder()
                .id(10L)
                .orderNumber("ORD-2026-0001")
                .customer(testCustomer)
                .vehicle(testVehicle)
                .status(RepairOrderStatus.RECEIVED)
                .build();

        when(repairOrderRepository.findByIdWithDetails(10L)).thenReturn(Optional.of(order));

        StatusChangeRequestDto invalidChange = StatusChangeRequestDto.builder()
                .newStatus(RepairOrderStatus.COMPLETED) // Salto no permitido desde RECEIVED
                .notes("Intento de cierre directo")
                .build();

        assertThatThrownBy(() -> repairOrderService.changeStatus(10L, invalidChange, "admin@paddock.es"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Transición no permitida: RECEIVED -> COMPLETED");

        verify(repairOrderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Solo permite eliminar órdenes en estado RECEIVED o CANCELLED")
    void delete_shouldThrowBusinessException_whenOrderIsInRepair() {
        RepairOrder inRepairOrder = RepairOrder.builder()
                .id(10L)
                .status(RepairOrderStatus.IN_REPAIR)
                .build();

        when(repairOrderRepository.findByIdWithDetails(10L)).thenReturn(Optional.of(inRepairOrder));

        assertThatThrownBy(() -> repairOrderService.delete(10L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Solo se pueden eliminar órdenes en estado RECEIVED o CANCELLED");

        verify(repairOrderRepository, never()).delete(any());
    }
}
