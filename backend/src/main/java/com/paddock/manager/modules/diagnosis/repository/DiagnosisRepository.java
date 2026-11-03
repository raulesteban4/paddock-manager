package com.paddock.manager.modules.diagnosis.repository;

import com.paddock.manager.modules.diagnosis.entity.Diagnosis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DiagnosisRepository extends JpaRepository<Diagnosis, Long> {

    /**
     * Busca el diagnóstico asociado a una orden de reparación.
     */
    Optional<Diagnosis> findByRepairOrderId(Long repairOrderId);

    /**
     * Comprueba si ya existe diagnóstico para una orden dada.
     */
    boolean existsByRepairOrderId(Long repairOrderId);

    /**
     * Busca el diagnóstico por número de orden.
     */
    @Query("SELECT d FROM Diagnosis d WHERE d.repairOrder.orderNumber = :orderNumber")
    Optional<Diagnosis> findByOrderNumber(@Param("orderNumber") String orderNumber);
}

