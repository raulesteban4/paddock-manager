package com.paddock.manager.modules.budget.repository;

import com.paddock.manager.modules.budget.entity.BudgetItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BudgetItemRepository extends JpaRepository<BudgetItem, Long> {

    List<BudgetItem> findByBudgetId(Long budgetId);
}

