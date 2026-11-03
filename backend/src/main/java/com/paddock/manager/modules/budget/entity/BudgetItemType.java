package com.paddock.manager.modules.budget.entity;

/**
 * Tipos de conceptos o líneas dentro de un Presupuesto.
 * Sincronizados con el CHECK constraint en budget_items de 01-schema.sql.
 */
public enum BudgetItemType {
    /** Mano de obra del taller (horas de trabajo) */
    LABOR,
    /** Pieza o recambio sustituido */
    PART,
    /** Trabajo de diagnóstico técnico o prueba en banco/máquina */
    DIAGNOSIS,
    /** Otros conceptos (tasas, gestión de residuos, etc.) */
    OTHER
}

