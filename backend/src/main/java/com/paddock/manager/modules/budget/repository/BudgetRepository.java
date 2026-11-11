package com.paddock.manager.modules.budget.repository;

import com.paddock.manager.modules.budget.entity.Budget;
import com.paddock.manager.modules.budget.entity.BudgetStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    @EntityGraph(attributePaths = {"repairOrder", "repairOrder.customer", "repairOrder.vehicle", "items"})
    Optional<Budget> findByRepairOrderId(Long repairOrderId);

    boolean existsByRepairOrderId(Long repairOrderId);

    @EntityGraph(attributePaths = {"repairOrder", "repairOrder.customer", "repairOrder.vehicle", "items"})
    @Query("SELECT b FROM Budget b WHERE b.repairOrder.orderNumber = :orderNumber")
    Optional<Budget> findByOrderNumber(@Param("orderNumber") String orderNumber);

    @EntityGraph(attributePaths = {"repairOrder", "repairOrder.customer", "repairOrder.vehicle", "items"})
    @Query("SELECT b FROM Budget b WHERE b.id = :id")
    Optional<Budget> findByIdWithDetails(@Param("id") Long id);

    @Override
    @EntityGraph(attributePaths = {"repairOrder", "repairOrder.customer", "repairOrder.vehicle", "items"})
    Page<Budget> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"repairOrder", "repairOrder.customer", "repairOrder.vehicle", "items"})
    Page<Budget> findByStatus(BudgetStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"repairOrder", "repairOrder.customer", "repairOrder.vehicle", "items"})
    @Query("SELECT b FROM Budget b WHERE " +
           "LOWER(b.repairOrder.orderNumber) LIKE :pattern OR " +
           "LOWER(b.repairOrder.vehicle.licensePlate) LIKE :pattern OR " +
           "LOWER(b.repairOrder.customer.firstName) LIKE :pattern OR " +
           "LOWER(b.repairOrder.customer.lastName) LIKE :pattern")
    Page<Budget> searchBudgets(@Param("pattern") String pattern, Pageable pageable);

    @EntityGraph(attributePaths = {"repairOrder", "repairOrder.customer", "repairOrder.vehicle", "items"})
    @Query("SELECT b FROM Budget b WHERE b.status = :status AND (" +
           "LOWER(b.repairOrder.orderNumber) LIKE :pattern OR " +
           "LOWER(b.repairOrder.vehicle.licensePlate) LIKE :pattern OR " +
           "LOWER(b.repairOrder.customer.firstName) LIKE :pattern OR " +
           "LOWER(b.repairOrder.customer.lastName) LIKE :pattern)")
    Page<Budget> searchBudgetsWithStatus(@Param("status") BudgetStatus status,
                                         @Param("pattern") String pattern,
                                         Pageable pageable);

    @Query("SELECT COALESCE(SUM(b.total), 0) FROM Budget b WHERE b.status = :status")
    java.math.BigDecimal sumTotalByStatus(@Param("status") BudgetStatus status);
}
