package com.paddock.manager.modules.repairorder.entity;

/**
 * Estados del ciclo de vida de una Orden de Reparación en el taller.
 * Sincronizados con el CHECK constraint de PostgreSQL en 01-schema.sql.
 */
public enum RepairOrderStatus {
    /** Recepcionado en taller */
    RECEIVED,
    /** En diagnóstico / inspección por mecánico */
    DIAGNOSIS,
    /** Presupuesto pendiente de aprobación por el cliente */
    QUOTE_PENDING,
    /** Presupuesto aprobado, listo para reparar */
    APPROVED,
    /** En reparación activa en el taller */
    IN_REPAIR,
    /** En espera de piezas / repuestos de almacén o proveedor */
    WAITING_FOR_PARTS,
    /** Reparación y pruebas completadas */
    COMPLETED,
    /** Vehículo entregado al cliente */
    DELIVERED,
    /** Orden cancelada */
    CANCELLED
}

