package com.paddock.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.paddock.manager.modules.appointment.repository.AppointmentRepository;
import com.paddock.manager.modules.customer.entity.Customer;
import com.paddock.manager.modules.customer.repository.CustomerRepository;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = "admin@paddock.com", roles = {"ADMIN"})
class RepairOrderControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired RepairOrderRepository repairOrderRepository;
    @Autowired StatusHistoryRepository statusHistoryRepository;
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
        statusHistoryRepository.deleteAll();
        repairOrderRepository.deleteAll();
        appointmentRepository.deleteAll();
        vehicleRepository.deleteAll();
        customerRepository.deleteAll();

        customer = customerRepository.save(Customer.builder()
                .dniCif("12345678Z")
                .firstName("Carlos")
                .lastName("Sainz")
                .email("carlos@paddock.com")
                .phone("622334455")
                .build());

        vehicle = vehicleRepository.save(Vehicle.builder()
                .licensePlate("5555F1")
                .vin("WVWZZZ55555555555")
                .brand("Ferrari")
                .model("F40")
                .year(2024)
                .fuelType(FuelType.GASOLINE)
                .mileage(12000)
                .customer(customer)
                .build());

        Role mechanicRole = roleRepository.findByName("ROLE_MECHANIC")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_MECHANIC").description("Mecánico").build()));

        mechanic = userRepository.findByEmail("mecanico.test@paddock.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .email("mecanico.test@paddock.com")
                        .password(passwordEncoder.encode("password123"))
                        .firstName("Pedro")
                        .lastName("De la Rosa")
                        .role(mechanicRole)
                        .enabled(true)
                        .build()));
    }

    private RepairOrderRequestDto buildValidRequest() {
        return RepairOrderRequestDto.builder()
                .customerId(customer.getId())
                .vehicleId(vehicle.getId())
                .mechanicId(mechanic.getId())
                .mileageAtEntry(12500)
                .customerIssue("Ruido en caja de cambios y vibración a 100 km/h")
                .observations("Revisar soportes de motor y aceite de transmisión")
                .priority(RepairOrderPriority.HIGH)
                .build();
    }

    @Test
    void shouldCreateRepairOrderSuccessfully() throws Exception {
        RepairOrderRequestDto request = buildValidRequest();

        mockMvc.perform(post("/api/repair-orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderNumber", startsWith("ORD-")))
                .andExpect(jsonPath("$.data.status").value("RECEIVED"))
                .andExpect(jsonPath("$.data.priority").value("HIGH"))
                .andExpect(jsonPath("$.data.customerName").value("Carlos Sainz"))
                .andExpect(jsonPath("$.data.licensePlate").value("5555F1"))
                .andExpect(jsonPath("$.data.mechanicName").value("Pedro De la Rosa"))
                .andExpect(jsonPath("$.data.statusHistory", hasSize(1)));
    }

    @Test
    void shouldRejectOrderWhenVehicleDoesNotBelongToCustomer() throws Exception {
        Customer otherCustomer = customerRepository.save(Customer.builder()
                .dniCif("99999999X")
                .firstName("Otro")
                .lastName("Cliente")
                .email("otro.cliente@email.com")
                .phone("600999888")
                .build());

        RepairOrderRequestDto request = RepairOrderRequestDto.builder()
                .customerId(otherCustomer.getId())
                .vehicleId(vehicle.getId())
                .mileageAtEntry(12500)
                .customerIssue("Frenos gastados")
                .build();

        mockMvc.perform(post("/api/repair-orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message", containsString("no pertenece al cliente")));
    }

    @Test
    void shouldFindAllOrdersWithFilters() throws Exception {
        mockMvc.perform(post("/api/repair-orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(buildValidRequest())));

        mockMvc.perform(get("/api/repair-orders")
                        .param("status", "RECEIVED")
                        .param("priority", "HIGH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].licensePlate").value("5555F1"));
    }

    @Test
    void shouldChangeStatusSuccessfully() throws Exception {
        String response = mockMvc.perform(post("/api/repair-orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildValidRequest())))
                .andReturn().getResponse().getContentAsString();

        Number id = com.jayway.jsonpath.JsonPath.read(response, "$.data.id");

        StatusChangeRequestDto change = StatusChangeRequestDto.builder()
                .newStatus(RepairOrderStatus.DIAGNOSIS)
                .notes("Mecánico sube vehículo al elevador")
                .build();

        mockMvc.perform(patch("/api/repair-orders/" + id + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(change)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DIAGNOSIS"))
                .andExpect(jsonPath("$.data.statusHistory", hasSize(2)));
    }

    @Test
    void shouldRejectInvalidStatusTransition() throws Exception {
        String response = mockMvc.perform(post("/api/repair-orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildValidRequest())))
                .andReturn().getResponse().getContentAsString();

        Number id = com.jayway.jsonpath.JsonPath.read(response, "$.data.id");

        StatusChangeRequestDto invalidChange = StatusChangeRequestDto.builder()
                .newStatus(RepairOrderStatus.DELIVERED)
                .notes("Intento de entrega directa sin reparar")
                .build();

        mockMvc.perform(patch("/api/repair-orders/" + id + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidChange)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message", containsString("Transición no permitida")));
    }

    @Test
    void shouldDeleteOrderInReceivedStatus() throws Exception {
        String response = mockMvc.perform(post("/api/repair-orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildValidRequest())))
                .andReturn().getResponse().getContentAsString();

        Number id = com.jayway.jsonpath.JsonPath.read(response, "$.data.id");

        mockMvc.perform(delete("/api/repair-orders/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/repair-orders/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldGetAvailableMechanics() throws Exception {
        mockMvc.perform(get("/api/repair-orders/mechanics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", isA(Iterable.class)));
    }
}

