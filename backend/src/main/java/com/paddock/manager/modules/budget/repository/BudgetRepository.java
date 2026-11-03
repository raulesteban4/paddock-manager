package com.paddock.manager.modules.budget.repository;

import com.paddock.manager.modules.budget.entity.Budget;
import com.paddock.manager.modules.budget.entity.BudgetStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    /**
     * Busca el presupuesto asociado a una orden de reparación.
     */
    Optional<Budget> findByRepairOrderId(Long repairOrderId);

    /**
     * Comprueba si ya existe un presupuesto para una orden dada.
     */
    boolean existsByRepairOrderId(Long repairOrderId);

    /**
     * Busca el presupuesto por número de orden de reparación.
     */
    @Query("SELECT b FROM Budget b WHERE b.repairOrder.orderNumber = :orderNumber")
    Optional<Budget> findByOrderNumber(@Param("orderNumber") String orderNumber);

    /**
     * Búsqueda paginada con filtro opcional por estado y búsqueda por matrícula o número de orden.
     */
    @Query("SELECT b FROM Budget b WHERE " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:search IS NULL OR LOWER(b.repairOrder.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(b.repairOrder.vehicle.licensePlate) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(b.repairOrder.customer.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(b.repairOrder.customer.lastName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Budget> findAllWithFilters(@Param("status") BudgetStatus status,
                                    @Param("search") String search,
                                    Pageable pageable);
}

