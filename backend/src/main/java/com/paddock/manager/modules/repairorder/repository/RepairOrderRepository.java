package com.paddock.manager.modules.repairorder.repository;

import com.paddock.manager.modules.repairorder.entity.RepairOrder;
import com.paddock.manager.modules.repairorder.entity.RepairOrderPriority;
import com.paddock.manager.modules.repairorder.entity.RepairOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RepairOrderRepository extends JpaRepository<RepairOrder, Long> {

    @EntityGraph(attributePaths = {"customer", "vehicle", "mechanic"})
    @Query("""
            SELECT r FROM RepairOrder r
            WHERE (:status IS NULL OR r.status = :status)
              AND (:priority IS NULL OR r.priority = :priority)
              AND (:customerId IS NULL OR r.customer.id = :customerId)
              AND (:vehicleId IS NULL OR r.vehicle.id = :vehicleId)
              AND (:mechanicId IS NULL OR (r.mechanic IS NOT NULL AND r.mechanic.id = :mechanicId))
              AND (:search IS NULL OR (
                    LOWER(r.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(r.vehicle.licensePlate) LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(r.customer.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(r.customer.lastName) LIKE LOWER(CONCAT('%', :search, '%'))
              ))
            """)
    Page<RepairOrder> findAllWithFilters(
            @Param("status") RepairOrderStatus status,
            @Param("priority") RepairOrderPriority priority,
            @Param("customerId") Long customerId,
            @Param("vehicleId") Long vehicleId,
            @Param("mechanicId") Long mechanicId,
            @Param("search") String search,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"customer", "vehicle", "mechanic"})
    @Query("SELECT r FROM RepairOrder r WHERE r.id = :id")
    Optional<RepairOrder> findByIdWithDetails(@Param("id") Long id);

    @EntityGraph(attributePaths = {"customer", "vehicle", "mechanic"})
    Optional<RepairOrder> findByOrderNumber(String orderNumber);

    boolean existsByOrderNumber(String orderNumber);

    /** Obtiene el último número de orden generado para un prefijo de año (ej: ORD-2026-) */
    @Query("""
            SELECT r.orderNumber FROM RepairOrder r
            WHERE r.orderNumber LIKE CONCAT(:prefix, '%')
            ORDER BY r.orderNumber DESC
            LIMIT 1
            """)
    Optional<String> findLastOrderNumberWithPrefix(@Param("prefix") String prefix);

    long countByStatus(RepairOrderStatus status);
}

