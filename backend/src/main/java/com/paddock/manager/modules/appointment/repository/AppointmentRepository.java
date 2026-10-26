package com.paddock.manager.modules.appointment.repository;

import com.paddock.manager.modules.appointment.entity.Appointment;
import com.paddock.manager.modules.appointment.entity.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para Appointment.
 * Usamos @EntityGraph para cargar Customer y Vehicle en la misma query
 * y evitar el problema N+1 cuando el mapper necesita acceder a sus datos.
 */
@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    /**
     * Lista todas las citas con paginación y filtros opcionales.
     * Carga Customer y Vehicle en un solo JOIN para evitar N+1.
     */
    @EntityGraph(attributePaths = {"customer", "vehicle"})
    @Query("""
            SELECT a FROM Appointment a
            WHERE (:status IS NULL OR a.status = :status)
              AND (:customerId IS NULL OR a.customer.id = :customerId)
              AND (:vehicleId IS NULL OR a.vehicle.id = :vehicleId)
            ORDER BY a.appointmentDateTime ASC
            """)
    Page<Appointment> findAllWithFilters(
            @Param("status") AppointmentStatus status,
            @Param("customerId") Long customerId,
            @Param("vehicleId") Long vehicleId,
            Pageable pageable
    );

    /**
     * Busca una cita por ID cargando eager customer y vehicle.
     */
    @EntityGraph(attributePaths = {"customer", "vehicle"})
    @Query("SELECT a FROM Appointment a WHERE a.id = :id")
    Optional<Appointment> findByIdWithDetails(@Param("id") Long id);

    /**
     * Detecta conflicto de horario para un vehículo en una franja de ±1 hora.
     * Usamos comparación de fechas entre rangos para compatibilidad con H2 y PostgreSQL.
     */
    @Query("""
            SELECT COUNT(a) > 0 FROM Appointment a
            WHERE a.vehicle.id = :vehicleId
              AND a.status NOT IN ('COMPLETADA', 'CANCELADA')
              AND a.appointmentDateTime BETWEEN :from AND :to
              AND (:excludeId IS NULL OR a.id != :excludeId)
            """)
    boolean existsConflict(
            @Param("vehicleId") Long vehicleId,
            @Param("from") ZonedDateTime from,
            @Param("to") ZonedDateTime to,
            @Param("excludeId") Long excludeId
    );

    /** Cuenta citas activas (no completadas ni canceladas) de un cliente */
    long countByCustomerIdAndStatusNotIn(Long customerId, List<AppointmentStatus> statuses);
}

