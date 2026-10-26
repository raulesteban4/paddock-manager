package com.paddock.manager.modules.repairorder.repository;

import com.paddock.manager.modules.repairorder.entity.StatusHistory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StatusHistoryRepository extends JpaRepository<StatusHistory, Long> {

    @EntityGraph(attributePaths = {"changedBy"})
    List<StatusHistory> findByRepairOrderIdOrderByChangedAtAsc(Long repairOrderId);

    void deleteByRepairOrderId(Long repairOrderId);
}

