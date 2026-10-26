package com.paddock.manager.modules.appointment.entity;

/**
 * Estados posibles de una cita en el taller.
 * Sincronizados con el CHECK CONSTRAINT de la tabla 'appointments' en PostgreSQL.
 */
public enum AppointmentStatus {
    /** Cita registrada, pendiente de confirmar por el taller */
    PROGRAMADA,
    /** Cita confirmada por el taller */
    CONFIRMADA,
    /** El vehículo ya está en las instalaciones del taller */
    EN_TALLER,
    /** La cita ha sido atendida y los trabajos completados */
    COMPLETADA,
    /** La cita ha sido cancelada por el cliente o el taller */
    CANCELADA
}

