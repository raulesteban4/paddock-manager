package com.paddock.manager.modules.customer.repository;

import com.paddock.manager.modules.customer.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio Spring Data JPA para la entidad Customer.
 */
@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByDniCif(String dniCif);

    Optional<Customer> findByEmail(String email);

    boolean existsByDniCif(String dniCif);

    boolean existsByEmail(String email);

    boolean existsByDniCifAndIdNot(String dniCif, Long id);

    boolean existsByEmailAndIdNot(String email, Long id);

    /**
     * Búsqueda flexible insensible a mayúsculas/minúsculas por DNI, nombre, apellidos, email o teléfono.
     */
    @Query("SELECT c FROM Customer c WHERE " +
           "LOWER(c.dniCif) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "c.phone LIKE CONCAT('%', :search, '%')")
    Page<Customer> searchCustomers(@Param("search") String search, Pageable pageable);
}