package com.paddock.manager.modules.budget.entity;

/**
 * Estados posibles de un Presupuesto (Budget).
 * Sincronizados con el CHECK constraint de la base de datos en 01-schema.sql.
 */
public enum BudgetStatus {
    /** Presupuesto emitido, pendiente de aprobación por el cliente */
    PENDING,
    /** Presupuesto aceptado por el cliente */
    APPROVED,
    /** Presupuesto rechazado por el cliente */
    REJECTED
}

