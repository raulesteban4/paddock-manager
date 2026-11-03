package com.paddock.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.paddock.manager.modules.appointment.repository.AppointmentRepository;
import com.paddock.manager.modules.budget.dto.BudgetItemRequestDto;
import com.paddock.manager.modules.budget.dto.BudgetRequestDto;
import com.paddock.manager.modules.budget.dto.BudgetStatusChangeDto;
import com.paddock.manager.modules.budget.entity.BudgetItemType;
import com.paddock.manager.modules.budget.entity.BudgetStatus;
import com.paddock.manager.modules.budget.repository.BudgetItemRepository;
import com.paddock.manager.modules.budget.repository.BudgetRepository;
import com.paddock.manager.modules.customer.entity.Customer;
import com.paddock.manager.modules.customer.repository.CustomerRepository;
import com.paddock.manager.modules.diagnosis.repository.DiagnosisRepository;
import com.paddock.manager.modules.repairorder.dto.RepairOrderRequestDto;
import com.paddock.manager.modules.repairorder.dto.StatusChangeRequestDto;
import com.paddock.manager.modules.repairorder.entity.RepairOrder;
import com.paddock.manager.modules.repairorder.entity.RepairOrderPriority;
import com.paddock.manager.modules.repairorder.entity.RepairOrderStatus;
import com.paddock.manager.modules.repairorder.repository.RepairOrderRepository;
import com.paddock.manager.modules.repairorder.repository.StatusHistoryRepository;
import com.paddock.manager.modules.user.entity.Role;
import com.paddock.manager.modules.user.entity.User;
import com.paddock.manager.modules.user.repository.RoleRepository;
import com.paddock.manager.modules.user.repository.UserRepository;
import com.paddock.manager.modules.vehicle.entity.FuelType;
import com.paddock.manager.modules.vehicle.entity.Vehicle;
import com.paddock.manager.modules.vehicle.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests de integración para BudgetController.
 * Cubre: cálculo de partidas y 21% IVA, creación, unicidad, sincronización de estados con RepairOrder,
 * bloqueo de edición en aprobados y filtrado.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = "admin@paddock.com", roles = {"ADMIN", "RECEPTIONIST"})
class BudgetControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired BudgetItemRepository budgetItemRepository;
    @Autowired BudgetRepository budgetRepository;
    @Autowired DiagnosisRepository diagnosisRepository;
    @Autowired StatusHistoryRepository statusHistoryRepository;
    @Autowired RepairOrderRepository repairOrderRepository;
    @Autowired AppointmentRepository appointmentRepository;
    @Autowired VehicleRepository vehicleRepository;
    @Autowired CustomerRepository customerRepository;
    @Autowired UserRepository userRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private Customer customer;
    private Vehicle vehicle;
    private User mechanic;

    @BeforeEach
    void setUp() {
        // Limpieza estricta en orden inverso de claves foráneas
        budgetItemRepository.deleteAll();
        budgetRepository.deleteAll();
        diagnosisRepository.deleteAll();
        statusHistoryRepository.deleteAll();
        repairOrderRepository.deleteAll();
        appointmentRepository.deleteAll();
        vehicleRepository.deleteAll();
        customerRepository.deleteAll();

        customer = customerRepository.save(Customer.builder()
                .dniCif("77123456K")
                .firstName("Lewis")
                .lastName("Hamilton")
                .email("lewis@mercedes.com")
                .phone("655443322")
                .build());

        vehicle = vehicleRepository.save(Vehicle.builder()
                .licensePlate("4444F1")
                .vin("WBA3A5C50DF999944")
                .brand("Mercedes")
                .model("AMG GT")
                .year(2023)
                .fuelType(FuelType.GASOLINE)
                .mileage(8000)
                .customer(customer)
                .build());

        Role mechanicRole = roleRepository.findByName("ROLE_MECHANIC")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_MECHANIC").description("Mecánico").build()));

        mechanic = userRepository.findByEmail("mechanic.budget@paddock.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .email("mechanic.budget@paddock.com")
                        .password(passwordEncoder.encode("password123"))
                        .firstName("Toto")
                        .lastName("Wolff")
                        .role(mechanicRole)
                        .enabled(true)
                        .build()));
    }

    private Long createOrderInDiagnosisState() throws Exception {
        RepairOrderRequestDto createRequest = RepairOrderRequestDto.builder()
                .customerId(customer.getId())
                .vehicleId(vehicle.getId())
                .mechanicId(mechanic.getId())
                .mileageAtEntry(8500)
                .customerIssue("Vibración en eje delantero al frenar de 120 km/h a 0")
                .priority(RepairOrderPriority.HIGH)
                .build();

        MvcResult result = mockMvc.perform(post("/api/repair-orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        Long orderId = objectMapper.readTree(result.getResponse().getContentAsString()).at("/data/id").asLong();

        // Pasar a DIAGNOSIS
        StatusChangeRequestDto transition = StatusChangeRequestDto.builder()
                .newStatus(RepairOrderStatus.DIAGNOSIS)
                .notes("Vehículo subido a elevador para comprobación de discos")
                .build();

        mockMvc.perform(patch("/api/repair-orders/" + orderId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(transition)))
                .andExpect(status().isOk());

        return orderId;
    }

    private BudgetRequestDto buildSampleBudgetRequest(Long orderId) {
        return BudgetRequestDto.builder()
                .repairOrderId(orderId)
                .taxRate(new BigDecimal("21.00"))
                .customerNotes("Presupuesto con garantía de 1 año en piezas originales")
                .items(List.of(
                        BudgetItemRequestDto.builder()
                                .itemType(BudgetItemType.LABOR)
                                .description("Mano de obra sustitución de discos y pastillas")
                                .quantity(new BigDecimal("2.00"))
                                .unitPrice(new BigDecimal("45.00"))
                                .build(),
                        BudgetItemRequestDto.builder()
                                .itemType(BudgetItemType.PART)
                                .description("Juego de discos delanteros perforados")
                                .quantity(new BigDecimal("1.00"))
                                .unitPrice(new BigDecimal("65.00"))
                                .build()
                ))
                .build();
    }

    @Test
    void shouldCreateBudgetSuccessfullyAndCalculateTax() throws Exception {
        Long orderId = createOrderInDiagnosisState();
        BudgetRequestDto request = buildSampleBudgetRequest(orderId);

        // 2.0h * 45 = 90; 1.0 * 65 = 65 -> Subtotal: 155.00
        // IVA 21%: 155 * 0.21 = 32.55
        // Total: 187.55
        mockMvc.perform(post("/api/budgets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.repairOrderId").value(orderId))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.subtotal").value(155.00))
                .andExpect(jsonPath("$.data.taxRate").value(21.00))
                .andExpect(jsonPath("$.data.taxAmount").value(32.55))
                .andExpect(jsonPath("$.data.total").value(187.55))
                .andExpect(jsonPath("$.data.items", hasSize(2)));

        // Comprobar que la orden de reparación avanzó a QUOTE_PENDING automáticamente
        RepairOrder updatedOrder = repairOrderRepository.findById(orderId).orElseThrow();
        assertEquals(RepairOrderStatus.QUOTE_PENDING, updatedOrder.getStatus());
    }

    @Test
    void shouldRejectDuplicateBudgetForSameOrder() throws Exception {
        Long orderId = createOrderInDiagnosisState();
        BudgetRequestDto request = buildSampleBudgetRequest(orderId);

        // Primer presupuesto — OK
        mockMvc.perform(post("/api/budgets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Segundo presupuesto para la misma OR — debe fallar (422)
        mockMvc.perform(post("/api/budgets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void shouldApproveBudgetAndAdvanceRepairOrderToApproved() throws Exception {
        Long orderId = createOrderInDiagnosisState();
        BudgetRequestDto request = buildSampleBudgetRequest(orderId);

        MvcResult createResult = mockMvc.perform(post("/api/budgets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        Long budgetId = objectMapper.readTree(createResult.getResponse().getContentAsString()).at("/data/id").asLong();

        // Aprobar presupuesto
        BudgetStatusChangeDto statusChange = BudgetStatusChangeDto.builder()
                .newStatus(BudgetStatus.APPROVED)
                .notes("Aprobado por el cliente por WhatsApp")
                .build();

        mockMvc.perform(patch("/api/budgets/" + budgetId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusChange)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"));

        // Comprobar que la orden se sincronizó a APPROVED
        RepairOrder updatedOrder = repairOrderRepository.findById(orderId).orElseThrow();
        assertEquals(RepairOrderStatus.APPROVED, updatedOrder.getStatus());
    }

    @Test
    void shouldRejectEditingApprovedBudget() throws Exception {
        Long orderId = createOrderInDiagnosisState();
        BudgetRequestDto request = buildSampleBudgetRequest(orderId);

        MvcResult createResult = mockMvc.perform(post("/api/budgets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        Long budgetId = objectMapper.readTree(createResult.getResponse().getContentAsString()).at("/data/id").asLong();

        // Aprobar presupuesto
        BudgetStatusChangeDto statusChange = BudgetStatusChangeDto.builder()
                .newStatus(BudgetStatus.APPROVED)
                .notes("Aceptado en mostrador")
                .build();

        mockMvc.perform(patch("/api/budgets/" + budgetId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusChange)))
                .andExpect(status().isOk());

        // Intentar actualizar presupuesto aprobado — debe fallar (422)
        request.setCustomerNotes("Modificación no autorizada");
        mockMvc.perform(put("/api/budgets/" + budgetId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void shouldDeleteBudgetWhenInPendingState() throws Exception {
        Long orderId = createOrderInDiagnosisState();
        BudgetRequestDto request = buildSampleBudgetRequest(orderId);

        MvcResult createResult = mockMvc.perform(post("/api/budgets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        Long budgetId = objectMapper.readTree(createResult.getResponse().getContentAsString()).at("/data/id").asLong();

        mockMvc.perform(delete("/api/budgets/" + budgetId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/budgets/" + budgetId))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldFindBudgetByOrderNumber() throws Exception {
        Long orderId = createOrderInDiagnosisState();
        BudgetRequestDto request = buildSampleBudgetRequest(orderId);

        mockMvc.perform(post("/api/budgets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        RepairOrder order = repairOrderRepository.findById(orderId).orElseThrow();

        mockMvc.perform(get("/api/budgets/by-order-number/" + order.getOrderNumber()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderNumber").value(order.getOrderNumber()))
                .andExpect(jsonPath("$.data.total").value(187.55));
    }
}

