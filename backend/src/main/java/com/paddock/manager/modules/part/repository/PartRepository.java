package com.paddock.manager.modules.part.repository;

import com.paddock.manager.modules.part.entity.Part;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PartRepository extends JpaRepository<Part, Long> {

    Optional<Part> findByReferenceCodeIgnoreCase(String referenceCode);

    boolean existsByReferenceCodeIgnoreCase(String referenceCode);

    @Query("SELECT p FROM Part p WHERE p.stock <= p.minStock")
    Page<Part> findLowStockParts(Pageable pageable);

    @Query("SELECT p FROM Part p WHERE " +
           "LOWER(p.referenceCode) LIKE :pattern OR " +
           "LOWER(p.name) LIKE :pattern OR " +
           "LOWER(p.manufacturer) LIKE :pattern OR " +
           "LOWER(p.supplier) LIKE :pattern")
    Page<Part> searchParts(@Param("pattern") String pattern, Pageable pageable);

    @Query("SELECT p FROM Part p WHERE p.stock <= p.minStock AND (" +
           "LOWER(p.referenceCode) LIKE :pattern OR " +
           "LOWER(p.name) LIKE :pattern OR " +
           "LOWER(p.manufacturer) LIKE :pattern OR " +
           "LOWER(p.supplier) LIKE :pattern)")
    Page<Part> searchLowStockParts(@Param("pattern") String pattern, Pageable pageable);

    @Query("SELECT COUNT(p) FROM Part p WHERE p.stock <= p.minStock")
    long countLowStock();
}

