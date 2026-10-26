package com.paddock.manager.modules.appointment.entity;

import com.paddock.manager.modules.customer.entity.Customer;
import com.paddock.manager.modules.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;

/**
 * Entidad JPA para Citas del taller.
 * Mapea la tabla 'appointments' definida en 01-schema.sql.
 *
 * Relaciones:
 *   - ManyToOne con Customer (muchas citas para un cliente)
 *   - ManyToOne con Vehicle  (muchas citas para un vehículo)
 */
@Entity
@Table(name = "appointments")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ─── Relaciones ──────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    // ─── Datos de la Cita ────────────────────────────────────
    @Column(name = "appointment_date_time", nullable = false)
    private ZonedDateTime appointmentDateTime;

    @Column(name = "reason", nullable = false, length = 255)
    private String reason;

    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.PROGRAMADA;

    // ─── Auditoría ───────────────────────────────────────────
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

