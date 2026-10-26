package com.paddock.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.paddock.manager.modules.appointment.dto.AppointmentRequestDto;
import com.paddock.manager.modules.appointment.entity.AppointmentStatus;
import com.paddock.manager.modules.appointment.repository.AppointmentRepository;
import com.paddock.manager.modules.customer.entity.Customer;
import com.paddock.manager.modules.customer.repository.CustomerRepository;
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

import java.time.ZonedDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests de integración para AppointmentController.
 * Usa base de datos H2 en memoria (perfil "test").
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = "admin@paddock.com", roles = {"ADMIN"})
class AppointmentControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired AppointmentRepository appointmentRepository;
    @Autowired CustomerRepository customerRepository;
    @Autowired VehicleRepository vehicleRepository;

    private Customer customer;
    private Vehicle vehicle;

    @BeforeEach
    void setUp() {
        appointmentRepository.deleteAll();
        vehicleRepository.deleteAll();
        customerRepository.deleteAll();

        customer = customerRepository.save(Customer.builder()
                .dniCif("11111111A")
                .firstName("Fernando")
                .lastName("Alonso")
                .email("fernando@racing.com")
                .phone("600111222")
                .build());

        vehicle = vehicleRepository.save(Vehicle.builder()
                .licensePlate("F1ALONS")
                .vin("WVW12345678901234")
                .brand("Renault")
                .model("R5 Turbo")
                .year(2026)
                .fuelType(FuelType.GASOLINE)
                .mileage(1000)
                .customer(customer)
                .build());
    }

    // ─── Helper ──────────────────────────────────────────────

    private AppointmentRequestDto buildValidRequest() {
        return AppointmentRequestDto.builder()
                .customerId(customer.getId())
                .vehicleId(vehicle.getId())
                .appointmentDateTime(ZonedDateTime.now().plusDays(7))
                .reason("Revisión general y cambio de aceite")
                .observations("Consultar disponibilidad de piezas")
                .build();
    }

    private AppointmentRequestDto buildValidRequest(int daysAhead) {
        return AppointmentRequestDto.builder()
                .customerId(customer.getId())
                .vehicleId(vehicle.getId())
                .appointmentDateTime(ZonedDateTime.now().plusDays(daysAhead))
                .reason("Revisión de frenos y suspensión")
                .build();
    }

    // ─── Tests de Creación ────────────────────────────────────

    @Test
    void shouldCreateAppointmentSuccessfully() throws Exception {
        AppointmentRequestDto request = buildValidRequest();

        mockMvc.perform(post("/api/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").isNumber())
                .andExpect(jsonPath("$.data.reason").value("Revisión general y cambio de aceite"))
                .andExpect(jsonPath("$.data.status").value("PROGRAMADA"))
                .andExpect(jsonPath("$.data.customerName").value("Fernando Alonso"))
                .andExpect(jsonPath("$.data.licensePlate").value("F1ALONS"));
    }

    @Test
    void shouldReturnBadRequestForPastDate() throws Exception {
        AppointmentRequestDto request = AppointmentRequestDto.builder()
                .customerId(customer.getId())
                .vehicleId(vehicle.getId())
                .appointmentDateTime(ZonedDateTime.now().minusDays(1))
                .reason("Cita en el pasado")
                .build();

        mockMvc.perform(post("/api/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.appointmentDateTime").exists());
    }

    @Test
    void shouldReturnBadRequestWhenVehicleDoesNotBelongToCustomer() throws Exception {
        // Crear otro cliente con su propio vehículo
        Customer otherCustomer = customerRepository.save(Customer.builder()
                .dniCif("22222222B")
                .firstName("Otro")
                .lastName("Cliente")
                .email("otro@test.com")
                .phone("600000000")
                .build());

        AppointmentRequestDto request = AppointmentRequestDto.builder()
                .customerId(otherCustomer.getId())   // cliente diferente
                .vehicleId(vehicle.getId())           // vehículo del primer cliente
                .appointmentDateTime(ZonedDateTime.now().plusDays(5))
                .reason("Intento con vehículo de otro cliente")
                .build();

        mockMvc.perform(post("/api/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message", containsString("no pertenece al cliente")));
    }

    // ─── Tests de Consulta ────────────────────────────────────

    @Test
    void shouldListAppointmentsWithPagination() throws Exception {
        // Crear 2 citas en fechas distintas
        mockMvc.perform(post("/api/appointments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(buildValidRequest(5))));

        mockMvc.perform(post("/api/appointments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(buildValidRequest(10))));

        mockMvc.perform(get("/api/appointments").param("page", "0").param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.totalElements").value(2));
    }

    @Test
    void shouldFilterAppointmentsByStatus() throws Exception {
        mockMvc.perform(post("/api/appointments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(buildValidRequest(7))));

        mockMvc.perform(get("/api/appointments")
                        .param("status", "PROGRAMADA")
                        .param("page", "0").param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].status").value("PROGRAMADA"));
    }

    @Test
    void shouldReturn404WhenAppointmentNotFound() throws Exception {
        mockMvc.perform(get("/api/appointments/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    // ─── Tests de Cambio de Estado ────────────────────────────

    @Test
    void shouldChangeStatusSuccessfully() throws Exception {
        // Crear cita
        String response = mockMvc.perform(post("/api/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildValidRequest())))
                .andReturn().getResponse().getContentAsString();

        Number id = com.jayway.jsonpath.JsonPath.read(response, "$.data.id");

        // Confirmar cita
        mockMvc.perform(patch("/api/appointments/" + id + "/status")
                        .param("status", "CONFIRMADA"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONFIRMADA"));
    }

    @Test
    void shouldRejectInvalidStatusTransition() throws Exception {
        String response = mockMvc.perform(post("/api/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildValidRequest())))
                .andReturn().getResponse().getContentAsString();

        Number id = com.jayway.jsonpath.JsonPath.read(response, "$.data.id");

        // Intentar ir directo a COMPLETADA sin pasar por CONFIRMADA / EN_TALLER
        mockMvc.perform(patch("/api/appointments/" + id + "/status")
                        .param("status", "COMPLETADA"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message", containsString("Transición de estado inválida")));
    }

    // ─── Tests de Cancelación / Eliminación ──────────────────

    @Test
    void shouldCancelAppointment() throws Exception {
        String response = mockMvc.perform(post("/api/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildValidRequest())))
                .andReturn().getResponse().getContentAsString();

        Number id = com.jayway.jsonpath.JsonPath.read(response, "$.data.id");

        mockMvc.perform(patch("/api/appointments/" + id + "/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELADA"));
    }

    @Test
    void shouldDeleteAppointmentInProgramadaStatus() throws Exception {
        String response = mockMvc.perform(post("/api/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildValidRequest())))
                .andReturn().getResponse().getContentAsString();

        Number id = com.jayway.jsonpath.JsonPath.read(response, "$.data.id");

        mockMvc.perform(delete("/api/appointments/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/appointments/" + id))
                .andExpect(status().isNotFound());
    }
}

