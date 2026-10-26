package com.paddock.manager.modules.vehicle.repository;

import com.paddock.manager.modules.vehicle.entity.Vehicle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio Spring Data JPA para la entidad Vehicle.
 * Utiliza @EntityGraph para evitar consultas N+1 al cargar la relación con Customer.
 */
@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    @EntityGraph(attributePaths = {"customer"})
    Optional<Vehicle> findByLicensePlate(String licensePlate);

    @EntityGraph(attributePaths = {"customer"})
    Optional<Vehicle> findByVin(String vin);

    @Override
    @EntityGraph(attributePaths = {"customer"})
    Optional<Vehicle> findById(Long id);

    @Override
    @EntityGraph(attributePaths = {"customer"})
    Page<Vehicle> findAll(Pageable pageable);

    boolean existsByLicensePlate(String licensePlate);

    boolean existsByVin(String vin);

    boolean existsByLicensePlateAndIdNot(String licensePlate, Long id);

    boolean existsByVinAndIdNot(String vin, Long id);

    @EntityGraph(attributePaths = {"customer"})
    List<Vehicle> findByCustomerId(Long customerId);

    @EntityGraph(attributePaths = {"customer"})
    Page<Vehicle> findByCustomerId(Long customerId, Pageable pageable);

    /**
     * Búsqueda integral por matrícula, VIN, marca, modelo o datos del propietario.
     */
    @EntityGraph(attributePaths = {"customer"})
    @Query("SELECT v FROM Vehicle v JOIN v.customer c WHERE " +
           "LOWER(v.licensePlate) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.vin) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.brand) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.model) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.dniCif) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Vehicle> searchVehicles(@Param("search") String search, Pageable pageable);
}