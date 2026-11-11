package com.paddock.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.paddock.manager.modules.appointment.repository.AppointmentRepository;
import com.paddock.manager.modules.budget.repository.BudgetItemRepository;
import com.paddock.manager.modules.budget.repository.BudgetRepository;
import com.paddock.manager.modules.customer.repository.CustomerRepository;
import com.paddock.manager.modules.diagnosis.repository.DiagnosisRepository;
import com.paddock.manager.modules.part.dto.PartRequestDto;
import com.paddock.manager.modules.part.dto.StockAdjustmentDto;
import com.paddock.manager.modules.part.entity.Part;
import com.paddock.manager.modules.part.repository.PartRepository;
import com.paddock.manager.modules.repairorder.repository.RepairOrderRepository;
import com.paddock.manager.modules.repairorder.repository.StatusHistoryRepository;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = "admin@paddock.com", roles = {"ADMIN", "RECEPTIONIST"})
class PartControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
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
        partRepository.deleteAll();
        budgetItemRepository.deleteAll();
        budgetRepository.deleteAll();
        diagnosisRepository.deleteAll();
        statusHistoryRepository.deleteAll();
        repairOrderRepository.deleteAll();
        appointmentRepository.deleteAll();
        vehicleRepository.deleteAll();
        customerRepository.deleteAll();
    }

    private PartRequestDto buildSamplePartRequest() {
        return PartRequestDto.builder()
                .referenceCode("PAS-DEL-BREMBO")
                .name("Pastillas Delanteras Brembo Sport")
                .description("Juego de pastillas de alto rendimiento")
                .manufacturer("Brembo")
                .stock(12)
                .minStock(5)
                .unitPrice(new BigDecimal("75.00"))
                .costPrice(new BigDecimal("38.50"))
                .supplier("Brembo España")
                .build();
    }

    @Test
    void shouldCreatePartSuccessfully() throws Exception {
        PartRequestDto request = buildSamplePartRequest();

        mockMvc.perform(post("/api/parts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.referenceCode").value("PAS-DEL-BREMBO"))
                .andExpect(jsonPath("$.data.name").value("Pastillas Delanteras Brembo Sport"))
                .andExpect(jsonPath("$.data.stock").value(12))
                .andExpect(jsonPath("$.data.lowStock").value(false));
    }

    @Test
    void shouldRejectDuplicateReferenceCode() throws Exception {
        PartRequestDto request = buildSamplePartRequest();

        // Primera inserción
        mockMvc.perform(post("/api/parts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Segunda inserción con misma referencia (case-insensitive)
        request.setReferenceCode("pas-del-brembo");
        mockMvc.perform(post("/api/parts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void shouldAdjustStockPositivelyAndNegatively() throws Exception {
        Part part = partRepository.save(Part.builder()
                .referenceCode("ACE-01")
                .name("Aceite Motor")
                .stock(10)
                .minStock(5)
                .unitPrice(new BigDecimal("30.00"))
                .costPrice(new BigDecimal("15.00"))
                .build());

        // Añadir 5 unidades -> stock 15
        StockAdjustmentDto addDto = StockAdjustmentDto.builder().quantityDelta(5).reason("Entrada almacén").build();
        mockMvc.perform(patch("/api/parts/" + part.getId() + "/stock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stock").value(15));

        // Retirar 8 unidades -> stock 7
        StockAdjustmentDto subDto = StockAdjustmentDto.builder().quantityDelta(-8).reason("Consumo en orden").build();
        mockMvc.perform(patch("/api/parts/" + part.getId() + "/stock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(subDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stock").value(7));
    }

    @Test
    void shouldRejectNegativeStockAdjustment() throws Exception {
        Part part = partRepository.save(Part.builder()
                .referenceCode("FIL-01")
                .name("Filtro Aire")
                .stock(3)
                .minStock(2)
                .unitPrice(new BigDecimal("20.00"))
                .costPrice(new BigDecimal("10.00"))
                .build());

        // Intentar restar 5 cuando solo hay 3 -> debe rechazar (422)
        StockAdjustmentDto subDto = StockAdjustmentDto.builder().quantityDelta(-5).reason("Ajuste").build();
        mockMvc.perform(patch("/api/parts/" + part.getId() + "/stock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(subDto)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void shouldFindLowStockParts() throws Exception {
        // Pieza con stock normal (10 > 3)
        partRepository.save(Part.builder()
                .referenceCode("P1")
                .name("Pieza Normal")
                .stock(10)
                .minStock(3)
                .unitPrice(BigDecimal.TEN)
                .costPrice(BigDecimal.ONE)
                .build());

        // Pieza con bajo stock (2 <= 5)
        partRepository.save(Part.builder()
                .referenceCode("P2")
                .name("Pieza Escasa")
                .stock(2)
                .minStock(5)
                .unitPrice(BigDecimal.TEN)
                .costPrice(BigDecimal.ONE)
                .build());

        mockMvc.perform(get("/api/parts").param("lowStockOnly", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].referenceCode").value("P2"))
                .andExpect(jsonPath("$.data.content[0].lowStock").value(true));
    }

    @Test
    void shouldGetInventoryStats() throws Exception {
        partRepository.save(Part.builder()
                .referenceCode("ST1")
                .name("Pieza 1")
                .stock(10)
                .minStock(5)
                .unitPrice(new BigDecimal("20.00"))
                .costPrice(new BigDecimal("10.00"))
                .build());

        partRepository.save(Part.builder()
                .referenceCode("ST2")
                .name("Pieza 2")
                .stock(2)
                .minStock(5)
                .unitPrice(new BigDecimal("50.00"))
                .costPrice(new BigDecimal("25.00"))
                .build());

        // Total stock coste: 10*10 + 2*25 = 150.00
        // Total stock venta: 10*20 + 2*50 = 300.00
        // Low stock count: 1 (ST2)
        mockMvc.perform(get("/api/parts/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalParts").value(2))
                .andExpect(jsonPath("$.data.lowStockCount").value(1))
                .andExpect(jsonPath("$.data.totalCostValue").value(150.00))
                .andExpect(jsonPath("$.data.totalRetailValue").value(300.00));
    }

    @Test
    void shouldDeletePartSuccessfully() throws Exception {
        Part part = partRepository.save(Part.builder()
                .referenceCode("DEL-01")
                .name("Pieza a Borrar")
                .stock(0)
                .minStock(0)
                .unitPrice(BigDecimal.ONE)
                .costPrice(BigDecimal.ONE)
                .build());

        mockMvc.perform(delete("/api/parts/" + part.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/parts/" + part.getId()))
                .andExpect(status().isNotFound());
    }
}

