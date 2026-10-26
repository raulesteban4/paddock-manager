package com.paddock.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.paddock.manager.modules.repairorder.repository.RepairOrderRepository;
import com.paddock.manager.modules.repairorder.repository.StatusHistoryRepository;
import com.paddock.manager.modules.appointment.repository.AppointmentRepository;
import com.paddock.manager.modules.vehicle.repository.VehicleRepository;
import com.paddock.manager.modules.customer.dto.CustomerRequestDto;
import com.paddock.manager.modules.customer.repository.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = "admin@paddock.com", roles = {"ADMIN"})
class CustomerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private RepairOrderRepository repairOrderRepository;

    @Autowired
    private StatusHistoryRepository statusHistoryRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @BeforeEach
    void setUp() {
        // Borrar en orden inverso a las FK: historial → órdenes → citas → vehículos → clientes
        statusHistoryRepository.deleteAll();
        repairOrderRepository.deleteAll();
        appointmentRepository.deleteAll();
        vehicleRepository.deleteAll();
        customerRepository.deleteAll();
    }

    @Test
    void shouldCreateCustomerSuccessfully() throws Exception {
        CustomerRequestDto request = CustomerRequestDto.builder()
                .dniCif("12345678Z")
                .firstName("Carlos")
                .lastName("Sainz")
                .email("carlos.sainz@paddock.com")
                .phone("600123456")
                .address("Paseo de la Castellana 100")
                .city("Madrid")
                .build();

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").isNumber())
                .andExpect(jsonPath("$.data.dniCif").value("12345678Z"))
                .andExpect(jsonPath("$.data.fullName").value("Carlos Sainz"))
                .andExpect(jsonPath("$.data.email").value("carlos.sainz@paddock.com"));
    }

    @Test
    void shouldReturnBadRequestWhenValidationFails() throws Exception {
        // Objeto con email invÃ¡lido y campos obligatorios en blanco
        CustomerRequestDto invalidRequest = CustomerRequestDto.builder()
                .dniCif("")
                .firstName("")
                .lastName("")
                .email("correo-invalido")
                .phone("12")
                .build();

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value(containsString("Valid")))
                .andExpect(jsonPath("$.validationErrors.firstName").exists())
                .andExpect(jsonPath("$.validationErrors.email").exists())
                .andExpect(jsonPath("$.validationErrors.dniCif").exists());
    }

    @Test
    void shouldRejectDuplicateDni() throws Exception {
        CustomerRequestDto first = CustomerRequestDto.builder()
                .dniCif("55555555A")
                .firstName("Fernando")
                .lastName("Alonso")
                .email("fernando@paddock.com")
                .phone("611999888")
                .build();

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated());

        CustomerRequestDto duplicateDni = CustomerRequestDto.builder()
                .dniCif("55555555A")
                .firstName("Otro")
                .lastName("Piloto")
                .email("otro@paddock.com")
                .phone("622888777")
                .build();

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateDni)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message", containsString("55555555A")));
    }

    @Test
    void shouldGetCustomerByIdAndReturn404WhenNotFound() throws Exception {
        CustomerRequestDto request = CustomerRequestDto.builder()
                .dniCif("99887766K")
                .firstName("Antonio")
                .lastName("GarcÃ­a")
                .email("antonio@paddock.com")
                .phone("633112233")
                .build();

        String responseJson = mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Number id = com.jayway.jsonpath.JsonPath.read(responseJson, "$.data.id");

        // Buscar por ID existente
        mockMvc.perform(get("/api/customers/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.dniCif").value("99887766K"));

        // Buscar por ID inexistente
        mockMvc.perform(get("/api/customers/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void shouldUpdateCustomer() throws Exception {
        CustomerRequestDto request = CustomerRequestDto.builder()
                .dniCif("44332211M")
                .firstName("Luis")
                .lastName("Hamilton")
                .email("luis@paddock.com")
                .phone("644556677")
                .city("Sevilla")
                .build();

        String responseJson = mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Number id = com.jayway.jsonpath.JsonPath.read(responseJson, "$.data.id");

        CustomerRequestDto updateRequest = CustomerRequestDto.builder()
                .dniCif("44332211M")
                .firstName("Lewis")
                .lastName("Hamilton")
                .email("lewis.updated@paddock.com")
                .phone("644556677")
                .city("MÃ¡laga")
                .build();

        mockMvc.perform(put("/api/customers/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.firstName").value("Lewis"))
                .andExpect(jsonPath("$.data.city").value("MÃ¡laga"));
    }

    @Test
    void shouldDeleteCustomer() throws Exception {
        CustomerRequestDto request = CustomerRequestDto.builder()
                .dniCif("11223344J")
                .firstName("Pedro")
                .lastName("MartÃ­nez")
                .email("pedro@paddock.com")
                .phone("655443322")
                .build();

        String responseJson = mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Number id = com.jayway.jsonpath.JsonPath.read(responseJson, "$.data.id");

        mockMvc.perform(delete("/api/customers/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/customers/" + id))
                .andExpect(status().isNotFound());
    }
}