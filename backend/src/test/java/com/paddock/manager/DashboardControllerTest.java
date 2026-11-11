package com.paddock.manager;

import com.paddock.manager.modules.appointment.entity.Appointment;
import com.paddock.manager.modules.appointment.entity.AppointmentStatus;
import com.paddock.manager.modules.appointment.repository.AppointmentRepository;
import com.paddock.manager.modules.budget.entity.Budget;
import com.paddock.manager.modules.budget.entity.BudgetStatus;
import com.paddock.manager.modules.budget.repository.BudgetItemRepository;
import com.paddock.manager.modules.budget.repository.BudgetRepository;
import com.paddock.manager.modules.customer.entity.Customer;
import com.paddock.manager.modules.customer.repository.CustomerRepository;
import com.paddock.manager.modules.diagnosis.repository.DiagnosisRepository;
import com.paddock.manager.modules.part.entity.Part;
import com.paddock.manager.modules.part.repository.PartRepository;
import com.paddock.manager.modules.repairorder.entity.RepairOrder;
import com.paddock.manager.modules.repairorder.entity.RepairOrderPriority;
import com.paddock.manager.modules.repairorder.entity.RepairOrderStatus;
import com.paddock.manager.modules.repairorder.repository.RepairOrderRepository;
import com.paddock.manager.modules.repairorder.repository.StatusHistoryRepository;
import com.paddock.manager.modules.vehicle.entity.FuelType;
import com.paddock.manager.modules.vehicle.entity.Vehicle;
import com.paddock.manager.modules.vehicle.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired PartRepository partRepository;
    @Autowired BudgetItemRepository budgetItemRepository;
    @Autowired BudgetRepository budgetRepository;
    @Autowired DiagnosisRepository diagnosisRepository;
    @Autowired StatusHistoryRepository statusHistoryRepository;
    @Autowired RepairOrderRepository repairOrderRepository;
    @Autowired AppointmentRepository appointmentRepository;
    @Autowired VehicleRepository vehicleRepository;
    @Autowired CustomerRepository customerRepository;

    @BeforeEach
    void setUp() {
        budgetItemRepository.deleteAll();
        budgetRepository.deleteAll();
        diagnosisRepository.deleteAll();
        statusHistoryRepository.deleteAll();
        repairOrderRepository.deleteAll();
        appointmentRepository.deleteAll();
        vehicleRepository.deleteAll();
        customerRepository.deleteAll();
        partRepository.deleteAll();
    }

    @Test
    @WithMockUser(username = "admin@paddock.com", roles = {"ADMIN"})
    void getStats_emptyDatabase_returnsZeroMetrics() throws Exception {
        mockMvc.perform(get("/api/dashboard/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.vehiclesInWorkshop").value(0))
                .andExpect(jsonPath("$.data.activeRepairOrders").value(0))
                .andExpect(jsonPath("$.data.todayAppointments").value(0))
                .andExpect(jsonPath("$.data.lowStockParts").value(0))
                .andExpect(jsonPath("$.data.totalApprovedRevenue").value(0))
                .andExpect(jsonPath("$.data.recentOrders", hasSize(0)));
    }

    @Test
    @WithMockUser(username = "recepcion@paddock.com", roles = {"RECEPTIONIST"})
    void getStats_withActiveData_returnsCalculatedKpis() throws Exception {
        // 1. Cliente y Vehículo
        Customer customer = customerRepository.save(Customer.builder()
                .dniCif("12345678Z")
                .firstName("Carlos")
                .lastName("Sainz")
                .email("carlos@ferrari.com")
                .phone("600123456")
                .build());

        Vehicle vehicle = vehicleRepository.save(Vehicle.builder()
                .licensePlate("5555F1")
                .vin("SF23FERRARI555555")
                .brand("Ferrari")
                .model("SF-23")
                .year(2023)
                .fuelType(FuelType.HYBRID)
                .mileage(12000)
                .customer(customer)
                .build());

        // 2. Órdenes de Reparación: 1 en reparación, 1 en diagnosis, 1 entregada
        RepairOrder activeOrder1 = repairOrderRepository.save(RepairOrder.builder()
                .orderNumber("ORD-2026-0001")
                .customer(customer)
                .vehicle(vehicle)
                .entryDate(ZonedDateTime.now())
                .mileageAtEntry(12000)
                .customerIssue("Revisión de alerón delantero")
                .priority(RepairOrderPriority.HIGH)
                .status(RepairOrderStatus.IN_REPAIR)
                .build());

        RepairOrder activeOrder2 = repairOrderRepository.save(RepairOrder.builder()
                .orderNumber("ORD-2026-0002")
                .customer(customer)
                .vehicle(vehicle)
                .entryDate(ZonedDateTime.now())
                .mileageAtEntry(12000)
                .customerIssue("Vibración en eje trasero")
                .priority(RepairOrderPriority.MEDIUM)
                .status(RepairOrderStatus.DIAGNOSIS)
                .build());

        RepairOrder deliveredOrder = repairOrderRepository.save(RepairOrder.builder()
                .orderNumber("ORD-2026-0003")
                .customer(customer)
                .vehicle(vehicle)
                .entryDate(ZonedDateTime.now())
                .mileageAtEntry(11500)
                .customerIssue("Cambio de neumáticos")
                .priority(RepairOrderPriority.LOW)
                .status(RepairOrderStatus.DELIVERED)
                .build());

        // 3. Cita para hoy
        appointmentRepository.save(Appointment.builder()
                .customer(customer)
                .vehicle(vehicle)
                .appointmentDateTime(ZonedDateTime.now())
                .reason("Ajuste de telemetría")
                .status(AppointmentStatus.CONFIRMADA)
                .build());

        // 4. Piezas: 1 con stock bajo (3 <= 5) y 1 con stock óptimo (15 > 5)
        partRepository.save(Part.builder()
                .referenceCode("ALERON-01")
                .name("Flap Alerón Delantero")
                .stock(3)
                .minStock(5)
                .unitPrice(new BigDecimal("450.00"))
                .costPrice(new BigDecimal("200.00"))
                .build());

        partRepository.save(Part.builder()
                .referenceCode("BUJIA-F1")
                .name("Bujía Iridio Racing")
                .stock(15)
                .minStock(5)
                .unitPrice(new BigDecimal("25.00"))
                .costPrice(new BigDecimal("10.00"))
                .build());

        // 5. Presupuesto Aprobado (Total 350.00 €)
        budgetRepository.save(Budget.builder()
                .repairOrder(activeOrder1)
                .status(BudgetStatus.APPROVED)
                .subtotal(new BigDecimal("289.26"))
                .taxRate(new BigDecimal("21.00"))
                .taxAmount(new BigDecimal("60.74"))
                .total(new BigDecimal("350.00"))
                .build());

        // Consultar Dashboard
        mockMvc.perform(get("/api/dashboard/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.vehiclesInWorkshop").value(1))
                .andExpect(jsonPath("$.data.activeRepairOrders").value(2))
                .andExpect(jsonPath("$.data.todayAppointments").value(1))
                .andExpect(jsonPath("$.data.lowStockParts").value(1))
                .andExpect(jsonPath("$.data.totalApprovedRevenue").value(350.00))
                .andExpect(jsonPath("$.data.ordersByStatus.IN_REPAIR").value(1))
                .andExpect(jsonPath("$.data.ordersByStatus.DIAGNOSIS").value(1))
                .andExpect(jsonPath("$.data.recentOrders", hasSize(2)))
                .andExpect(jsonPath("$.data.recentOrders[0].orderNumber").value("ORD-2026-0002"))
                .andExpect(jsonPath("$.data.recentOrders[1].orderNumber").value("ORD-2026-0001"));
    }

    @Test
    void getStats_unauthenticated_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/dashboard/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}
