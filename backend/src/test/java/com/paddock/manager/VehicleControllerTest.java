package com.paddock.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.paddock.manager.modules.repairorder.repository.RepairOrderRepository;
import com.paddock.manager.modules.repairorder.repository.StatusHistoryRepository;
import com.paddock.manager.modules.appointment.repository.AppointmentRepository;
import com.paddock.manager.modules.customer.entity.Customer;
import com.paddock.manager.modules.customer.repository.CustomerRepository;
import com.paddock.manager.modules.vehicle.dto.VehicleRequestDto;
import com.paddock.manager.modules.vehicle.entity.FuelType;
import com.paddock.manager.modules.vehicle.repository.VehicleRepository;
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
class VehicleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private RepairOrderRepository repairOrderRepository;

    @Autowired
    private StatusHistoryRepository statusHistoryRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private CustomerRepository customerRepository;

    private Customer testCustomer;

    @BeforeEach
    void setUp() {
        statusHistoryRepository.deleteAll();
        repairOrderRepository.deleteAll();
        appointmentRepository.deleteAll();
        vehicleRepository.deleteAll();
        customerRepository.deleteAll();

        testCustomer = customerRepository.save(Customer.builder()
                .dniCif("12345678Z")
                .firstName("Juan")
                .lastName("PÃ©rez")
                .email("juan.perez@email.com")
                .phone("611223344")
                .build());
    }

    @Test
    void shouldCreateVehicleSuccessfully() throws Exception {
        VehicleRequestDto request = VehicleRequestDto.builder()
                .licensePlate("1234ABC")
                .vin("WVWZZZ3CZWE123456")
                .brand("Volkswagen")
                .model("Golf 2.0 TDI")
                .year(2020)
                .fuelType(FuelType.DIESEL)
                .engine("2.0 TDI 150cv")
                .mileage(85000)
                .customerId(testCustomer.getId())
                .build();

        mockMvc.perform(post("/api/vehicles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").isNumber())
                .andExpect(jsonPath("$.data.licensePlate").value("1234ABC"))
                .andExpect(jsonPath("$.data.vin").value("WVWZZZ3CZWE123456"))
                .andExpect(jsonPath("$.data.customerId").value(testCustomer.getId()))
                .andExpect(jsonPath("$.data.customerName").value("Juan PÃ©rez"))
                .andExpect(jsonPath("$.data.customerDni").value("12345678Z"));
    }

    @Test
    void shouldReturn404WhenCustomerDoesNotExist() throws Exception {
        VehicleRequestDto request = VehicleRequestDto.builder()
                .licensePlate("9999XYZ")
                .vin("WVWZZZ3CZWE999999")
                .brand("Audi")
                .model("A4")
                .year(2021)
                .fuelType(FuelType.DIESEL)
                .mileage(30000)
                .customerId(999999L)
                .build();

        mockMvc.perform(post("/api/vehicles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Cliente no encontrado")));
    }

    @Test
    void shouldRejectDuplicateLicensePlate() throws Exception {
        VehicleRequestDto first = VehicleRequestDto.builder()
                .licensePlate("5678DEF")
                .vin("WBA3A5C50DF987654")
                .brand("BMW")
                .model("320d")
                .year(2018)
                .fuelType(FuelType.DIESEL)
                .mileage(145000)
                .customerId(testCustomer.getId())
                .build();

        mockMvc.perform(post("/api/vehicles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated());

        VehicleRequestDto duplicatePlate = VehicleRequestDto.builder()
                .licensePlate("5678DEF")
                .vin("WBA3A5C50DF111111")
                .brand("BMW")
                .model("318d")
                .year(2019)
                .fuelType(FuelType.DIESEL)
                .mileage(100000)
                .customerId(testCustomer.getId())
                .build();

        mockMvc.perform(post("/api/vehicles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicatePlate)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message", containsString("5678DEF")));
    }

    @Test
    void shouldRejectDuplicateVin() throws Exception {
        VehicleRequestDto first = VehicleRequestDto.builder()
                .licensePlate("1111AAA")
                .vin("WBA3A5C50DF999999")
                .brand("BMW")
                .model("320d")
                .year(2018)
                .fuelType(FuelType.DIESEL)
                .mileage(145000)
                .customerId(testCustomer.getId())
                .build();

        mockMvc.perform(post("/api/vehicles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated());

        VehicleRequestDto duplicateVin = VehicleRequestDto.builder()
                .licensePlate("2222BBB")
                .vin("WBA3A5C50DF999999")
                .brand("BMW")
                .model("320d")
                .year(2018)
                .fuelType(FuelType.DIESEL)
                .mileage(145000)
                .customerId(testCustomer.getId())
                .build();

        mockMvc.perform(post("/api/vehicles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateVin)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message", containsString("WBA3A5C50DF999999")));
    }

    @Test
    void shouldFailWhenValidationFails() throws Exception {
        // Objeto con matrÃ­cula vacÃ­a, VIN corto, aÃ±o fuera de rango y kilometraje negativo
        VehicleRequestDto invalid = VehicleRequestDto.builder()
                .licensePlate("")
                .vin("VIN_CORTO")
                .brand("")
                .model("")
                .year(1800)
                .fuelType(null)
                .mileage(-50)
                .customerId(null)
                .build();

        mockMvc.perform(post("/api/vehicles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.licensePlate").exists())
                .andExpect(jsonPath("$.validationErrors.vin").exists())
                .andExpect(jsonPath("$.validationErrors.year").exists())
                .andExpect(jsonPath("$.validationErrors.mileage").exists())
                .andExpect(jsonPath("$.validationErrors.fuelType").exists())
                .andExpect(jsonPath("$.validationErrors.customerId").exists());
    }

    @Test
    void shouldGetVehicleByPlate() throws Exception {
        VehicleRequestDto request = VehicleRequestDto.builder()
                .licensePlate("7777XYZ")
                .vin("VF1RFB00861112233")
                .brand("Renault")
                .model("Megane")
                .year(2021)
                .fuelType(FuelType.GASOLINE)
                .mileage(42000)
                .customerId(testCustomer.getId())
                .build();

        mockMvc.perform(post("/api/vehicles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/vehicles/by-plate/7777XYZ"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.licensePlate").value("7777XYZ"))
                .andExpect(jsonPath("$.data.brand").value("Renault"));
    }

    @Test
    void shouldGetVehiclesByCustomer() throws Exception {
        VehicleRequestDto request = VehicleRequestDto.builder()
                .licensePlate("8888CCC")
                .vin("VF1RFB00869999999")
                .brand("Seat")
                .model("Ibiza")
                .year(2019)
                .fuelType(FuelType.GASOLINE)
                .mileage(60000)
                .customerId(testCustomer.getId())
                .build();

        mockMvc.perform(post("/api/vehicles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/vehicles/by-customer/" + testCustomer.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].licensePlate").value("8888CCC"));
    }

    @Test
    void shouldUpdateVehicle() throws Exception {
        VehicleRequestDto request = VehicleRequestDto.builder()
                .licensePlate("3333DDD")
                .vin("VF1RFB00863333333")
                .brand("Ford")
                .model("Focus")
                .year(2020)
                .fuelType(FuelType.DIESEL)
                .mileage(50000)
                .customerId(testCustomer.getId())
                .build();

        String responseJson = mockMvc.perform(post("/api/vehicles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Number id = com.jayway.jsonpath.JsonPath.read(responseJson, "$.data.id");

        VehicleRequestDto updateRequest = VehicleRequestDto.builder()
                .licensePlate("3333DDD")
                .vin("VF1RFB00863333333")
                .brand("Ford")
                .model("Focus ST-Line")
                .year(2020)
                .fuelType(FuelType.DIESEL)
                .mileage(55000)
                .customerId(testCustomer.getId())
                .build();

        mockMvc.perform(put("/api/vehicles/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.model").value("Focus ST-Line"))
                .andExpect(jsonPath("$.data.mileage").value(55000));
    }

    @Test
    void shouldDeleteVehicle() throws Exception {
        VehicleRequestDto request = VehicleRequestDto.builder()
                .licensePlate("4444EEE")
                .vin("VF1RFB00864444444")
                .brand("Peugeot")
                .model("308")
                .year(2017)
                .fuelType(FuelType.DIESEL)
                .mileage(120000)
                .customerId(testCustomer.getId())
                .build();

        String responseJson = mockMvc.perform(post("/api/vehicles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Number id = com.jayway.jsonpath.JsonPath.read(responseJson, "$.data.id");

        mockMvc.perform(delete("/api/vehicles/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/vehicles/" + id))
                .andExpect(status().isNotFound());
    }
}