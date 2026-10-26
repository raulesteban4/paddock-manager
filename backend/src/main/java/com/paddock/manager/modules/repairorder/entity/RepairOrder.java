package com.paddock.manager.modules.repairorder.entity;

import com.paddock.manager.modules.customer.entity.Customer;
import com.paddock.manager.modules.user.entity.User;
import com.paddock.manager.modules.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;

/**
 * Entidad JPA para Órdenes de Reparación (Repair Orders).
 * Entidad central del flujo de trabajo de Paddock Manager.
 */
@Entity
@Table(name = "repair_orders")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepairOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true, length = 50)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mechanic_id")
    private User mechanic;

    @Column(name = "entry_date", nullable = false)
    private ZonedDateTime entryDate;

    @Column(name = "estimated_delivery_date")
    private ZonedDateTime estimatedDeliveryDate;

    @Column(name = "mileage_at_entry", nullable = false)
    private Integer mileageAtEntry;

    @Column(name = "customer_issue", nullable = false, columnDefinition = "TEXT")
    private String customerIssue;

    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    private RepairOrderPriority priority = RepairOrderPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private RepairOrderStatus status = RepairOrderStatus.RECEIVED;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

