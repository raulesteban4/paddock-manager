package com.paddock.manager.modules.appointment.service;

import com.paddock.manager.common.exception.BusinessException;
import com.paddock.manager.common.exception.ResourceNotFoundException;
import com.paddock.manager.modules.appointment.dto.AppointmentRequestDto;
import com.paddock.manager.modules.appointment.dto.AppointmentResponseDto;
import com.paddock.manager.modules.appointment.entity.Appointment;
import com.paddock.manager.modules.appointment.entity.AppointmentStatus;
import com.paddock.manager.modules.appointment.mapper.AppointmentMapper;
import com.paddock.manager.modules.appointment.repository.AppointmentRepository;
import com.paddock.manager.modules.customer.entity.Customer;
import com.paddock.manager.modules.customer.repository.CustomerRepository;
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

import java.time.ZonedDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AppointmentServiceImpl - Tests Unitarios con Mockito")
class AppointmentServiceImplTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Spy
    private AppointmentMapper mapper = new AppointmentMapper();

    @InjectMocks
    private AppointmentServiceImpl appointmentService;

    private Customer testCustomer;
    private Vehicle testVehicle;
    private ZonedDateTime appointmentTime;

    @BeforeEach
    void setUp() {
        testCustomer = Customer.builder()
                .id(1L)
                .firstName("Lewis")
                .lastName("Hamilton")
                .phone("688990011")
                .build();

        testVehicle = Vehicle.builder()
                .id(10L)
                .brand("Mercedes")
                .model("AMG GT")
                .licensePlate("4444-LH")
                .year(2022)
                .customer(testCustomer)
                .build();

        appointmentTime = ZonedDateTime.now().plusDays(2);
    }

    @Test
    @DisplayName("Debe crear una cita en estado PROGRAMADA cuando no hay conflictos")
    void create_shouldSaveAppointment_whenNoConflictExists() {
        AppointmentRequestDto request = AppointmentRequestDto.builder()
                .customerId(1L)
                .vehicleId(10L)
                .appointmentDateTime(appointmentTime)
                .reason("Revisión de mantenimiento A")
                .observations("Cliente solicita coche de sustitución")
                .build();

        when(customerRepository.findById(1L)).thenReturn(Optional.of(testCustomer));
        when(vehicleRepository.findById(10L)).thenReturn(Optional.of(testVehicle));
        when(appointmentRepository.existsConflict(eq(10L), any(), any(), eq(null))).thenReturn(false);

        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> {
            Appointment a = i.getArgument(0);
            a.setId(100L);
            return a;
        });

        AppointmentResponseDto response = appointmentService.create(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getStatus()).isEqualTo(AppointmentStatus.PROGRAMADA);
        assertThat(response.getCustomerName()).isEqualTo("Lewis Hamilton");
        assertThat(response.getLicensePlate()).isEqualTo("4444-LH");

        verify(appointmentRepository).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Debe lanzar BusinessException si el vehículo no pertenece al cliente")
    void create_shouldThrowBusinessException_whenVehicleDoesNotBelongToCustomer() {
        Customer otherCustomer = Customer.builder().id(2L).firstName("George").build();
        Vehicle otherVehicle = Vehicle.builder()
                .id(20L)
                .licensePlate("6363-GR")
                .customer(otherCustomer)
                .build();

        AppointmentRequestDto request = AppointmentRequestDto.builder()
                .customerId(1L)
                .vehicleId(20L)
                .appointmentDateTime(appointmentTime)
                .build();

        when(customerRepository.findById(1L)).thenReturn(Optional.of(testCustomer));
        when(vehicleRepository.findById(20L)).thenReturn(Optional.of(otherVehicle));

        assertThatThrownBy(() -> appointmentService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("no pertenece al cliente");

        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe lanzar BusinessException si hay conflicto de horario para el vehículo")
    void create_shouldThrowBusinessException_whenScheduleConflictExists() {
        AppointmentRequestDto request = AppointmentRequestDto.builder()
                .customerId(1L)
                .vehicleId(10L)
                .appointmentDateTime(appointmentTime)
                .build();

        when(customerRepository.findById(1L)).thenReturn(Optional.of(testCustomer));
        when(vehicleRepository.findById(10L)).thenReturn(Optional.of(testVehicle));
        when(appointmentRepository.existsConflict(eq(10L), any(), any(), eq(null))).thenReturn(true);

        assertThatThrownBy(() -> appointmentService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("El vehículo ya tiene una cita activa en esa franja horaria");

        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe permitir cambiar estado de PROGRAMADA a CONFIRMADA")
    void changeStatus_shouldUpdateStatus_whenTransitionIsValid() {
        Appointment appointment = Appointment.builder()
                .id(50L)
                .customer(testCustomer)
                .vehicle(testVehicle)
                .status(AppointmentStatus.PROGRAMADA)
                .build();

        when(appointmentRepository.findByIdWithDetails(50L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

        AppointmentResponseDto response = appointmentService.changeStatus(50L, AppointmentStatus.CONFIRMADA);

        assertThat(response.getStatus()).isEqualTo(AppointmentStatus.CONFIRMADA);
        verify(appointmentRepository).save(appointment);
    }

    @Test
    @DisplayName("Debe rechazar transición inválida (p.ej. PROGRAMADA a COMPLETADA directamente)")
    void changeStatus_shouldThrowBusinessException_whenTransitionIsInvalid() {
        Appointment appointment = Appointment.builder()
                .id(50L)
                .status(AppointmentStatus.PROGRAMADA)
                .build();

        when(appointmentRepository.findByIdWithDetails(50L)).thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> appointmentService.changeStatus(50L, AppointmentStatus.COMPLETADA))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Transición de estado inválida: PROGRAMADA → COMPLETADA");

        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe cancelar cita programada")
    void cancel_shouldSetStatusToCancelada() {
        Appointment appointment = Appointment.builder()
                .id(60L)
                .customer(testCustomer)
                .vehicle(testVehicle)
                .status(AppointmentStatus.PROGRAMADA)
                .build();

        when(appointmentRepository.findByIdWithDetails(60L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

        AppointmentResponseDto response = appointmentService.cancel(60L);

        assertThat(response.getStatus()).isEqualTo(AppointmentStatus.CANCELADA);
        verify(appointmentRepository).save(appointment);
    }

    @Test
    @DisplayName("No permite eliminar citas en estado EN_TALLER")
    void delete_shouldThrowBusinessException_whenAppointmentIsInWorkshop() {
        Appointment appointment = Appointment.builder()
                .id(70L)
                .status(AppointmentStatus.EN_TALLER)
                .build();

        when(appointmentRepository.findByIdWithDetails(70L)).thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> appointmentService.delete(70L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("No se puede eliminar una cita en estado EN_TALLER");

        verify(appointmentRepository, never()).delete(any());
    }
}
