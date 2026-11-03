package com.paddock.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.paddock.manager.modules.appointment.repository.AppointmentRepository;
import com.paddock.manager.modules.customer.entity.Customer;
import com.paddock.manager.modules.customer.repository.CustomerRepository;
import com.paddock.manager.modules.diagnosis.dto.DiagnosisRequestDto;
import com.paddock.manager.modules.diagnosis.repository.DiagnosisRepository;
import com.paddock.manager.modules.repairorder.dto.RepairOrderRequestDto;
import com.paddock.manager.modules.repairorder.dto.StatusChangeRequestDto;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests de integración para DiagnosisController.
 * Cubre: creación, consulta por orden, actualización, rechazo por estado inválido y eliminación.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = "admin@paddock.com", roles = {"ADMIN", "MECHANIC"})
class DiagnosisControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
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
        // Limpieza en orden inverso de dependencias FK
        diagnosisRepository.deleteAll();
        statusHistoryRepository.deleteAll();
        repairOrderRepository.deleteAll();
        appointmentRepository.deleteAll();
        vehicleRepository.deleteAll();
        customerRepository.deleteAll();

        customer = customerRepository.save(Customer.builder()
                .dniCif("88123456P")
                .firstName("Fernando")
                .lastName("Alonso")
                .email("falonso@paddock.com")
                .phone("611223344")
                .build());

        vehicle = vehicleRepository.save(Vehicle.builder()
                .licensePlate("1234FA")
                .vin("WVWZZZ1JZXW000001")
                .brand("Alpine")
                .model("A110")
                .year(2023)
                .fuelType(FuelType.GASOLINE)
                .mileage(15000)
                .customer(customer)
                .build());

        Role mechanicRole = roleRepository.findByName("ROLE_MECHANIC")
                .orElseGet(() -> roleRepository.save(
                        Role.builder().name("ROLE_MECHANIC").description("Mecánico").build()));

        mechanic = userRepository.findByEmail("mechanic.diag@paddock.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .email("mechanic.diag@paddock.com")
                        .password(passwordEncoder.encode("password123"))
                        .firstName("Jenson")
                        .lastName("Button")
                        .role(mechanicRole)
                        .enabled(true)
                        .build()));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    /**
     * Crea una OR en estado RECEIVED y la transiciona a DIAGNOSIS.
     * Devuelve el ID de la OR creada.
     */
    private Long createOrderInDiagnosisState() throws Exception {
        // 1. Crear la OR
        RepairOrderRequestDto createRequest = RepairOrderRequestDto.builder()
                .customerId(customer.getId())
                .vehicleId(vehicle.getId())
                .mechanicId(mechanic.getId())
                .mileageAtEntry(15500)
                .customerIssue("Pérdida de potencia y exceso de consumo de combustible")
                .priority(RepairOrderPriority.MEDIUM)
                .build();

        MvcResult result = mockMvc.perform(post("/api/repair-orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String json = result.getResponse().getContentAsString();
        Long orderId = objectMapper.readTree(json).at("/data/id").asLong();

        // 2. Transicionar a DIAGNOSIS
        StatusChangeRequestDto transition = StatusChangeRequestDto.builder()
                .newStatus(RepairOrderStatus.DIAGNOSIS)
                .notes("Inicia inspección técnica")
                .build();

        mockMvc.perform(patch("/api/repair-orders/" + orderId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(transition)))
                .andExpect(status().isOk());

        return orderId;
    }

    private DiagnosisRequestDto buildValidDiagnosis(Long repairOrderId) {
        return DiagnosisRequestDto.builder()
                .repairOrderId(repairOrderId)
                .mechanicId(mechanic.getId())
                .symptoms("Pérdida de potencia progresiva. Consumo elevado. Humo negro por escape.")
                .diagnosis("Inyector nº3 defectuoso y filtro de combustible obstruido al 85%.")
                .recommendations("Sustituir inyector nº3 y filtro de combustible. Limpiar sistema EGR.")
                .observations("Motor sin pérdidas de aceite. Turbo en buen estado.")
                .build();
    }

    // ── Tests ────────────────────────────────────────────────────────────────────

    @Test
    void shouldCreateDiagnosisSuccessfully() throws Exception {
        Long orderId = createOrderInDiagnosisState();
        DiagnosisRequestDto dto = buildValidDiagnosis(orderId);

        mockMvc.perform(post("/api/diagnoses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").isNumber())
                .andExpect(jsonPath("$.data.repairOrderId").value(orderId))
                .andExpect(jsonPath("$.data.mechanicName").value("Jenson Button"))
                .andExpect(jsonPath("$.data.symptoms", not(emptyString())))
                .andExpect(jsonPath("$.data.diagnosis", containsString("nº3")));
    }

    @Test
    void shouldRejectDuplicateDiagnosis() throws Exception {
        Long orderId = createOrderInDiagnosisState();
        DiagnosisRequestDto dto = buildValidDiagnosis(orderId);

        // Primera creación — OK
        mockMvc.perform(post("/api/diagnoses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        // Segunda creación — debe fallar (422 BusinessException)
        mockMvc.perform(post("/api/diagnoses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void shouldRejectDiagnosisForOrderInReceivedStatus() throws Exception {
        // Crear una OR en estado RECEIVED (sin transicionar)
        RepairOrderRequestDto createRequest = RepairOrderRequestDto.builder()
                .customerId(customer.getId())
                .vehicleId(vehicle.getId())
                .mechanicId(mechanic.getId())
                .mileageAtEntry(15200)
                .customerIssue("Fallo en el sistema de frenos traseros")
                .priority(RepairOrderPriority.HIGH)
                .build();

        MvcResult result = mockMvc.perform(post("/api/repair-orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        Long orderId = objectMapper.readTree(result.getResponse().getContentAsString()).at("/data/id").asLong();

        // Intentar crear diagnóstico sobre una OR en RECEIVED — debe fallar (422 BusinessException)
        DiagnosisRequestDto dto = buildValidDiagnosis(orderId);

        mockMvc.perform(post("/api/diagnoses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void shouldGetDiagnosisByRepairOrderId() throws Exception {
        Long orderId = createOrderInDiagnosisState();
        DiagnosisRequestDto dto = buildValidDiagnosis(orderId);

        mockMvc.perform(post("/api/diagnoses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/diagnoses/by-order/" + orderId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.repairOrderId").value(orderId))
                .andExpect(jsonPath("$.data.symptoms", not(emptyString())));
    }

    @Test
    void shouldUpdateDiagnosisSuccessfully() throws Exception {
        Long orderId = createOrderInDiagnosisState();

        // Crear diagnóstico
        MvcResult createResult = mockMvc.perform(post("/api/diagnoses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildValidDiagnosis(orderId))))
                .andExpect(status().isCreated())
                .andReturn();

        Long diagnosisId = objectMapper.readTree(createResult.getResponse().getContentAsString()).at("/data/id").asLong();

        // Actualizar con nuevas observaciones
        DiagnosisRequestDto updateDto = buildValidDiagnosis(orderId);
        updateDto.setObservations("Actualizado: turbo con holgura leve, revisar en próxima revisión");

        mockMvc.perform(put("/api/diagnoses/" + diagnosisId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.observations", containsString("turbo con holgura")));
    }

    @Test
    void shouldDeleteDiagnosisWhenOrderIsInDiagnosisState() throws Exception {
        Long orderId = createOrderInDiagnosisState();

        MvcResult createResult = mockMvc.perform(post("/api/diagnoses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildValidDiagnosis(orderId))))
                .andExpect(status().isCreated())
                .andReturn();

        Long diagnosisId = objectMapper.readTree(createResult.getResponse().getContentAsString()).at("/data/id").asLong();

        mockMvc.perform(delete("/api/diagnoses/" + diagnosisId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Verificar que ya no existe
        mockMvc.perform(get("/api/diagnoses/" + diagnosisId))
                .andExpect(status().isNotFound());
    }
}
