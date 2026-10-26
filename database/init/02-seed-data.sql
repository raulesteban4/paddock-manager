-- ==============================================================================
-- Paddock Manager - Seed Data (Datos Iniciales de Prueba)
-- FASE 2: Roles, Usuarios, Clientes, Vehículos, Inventario y Orden de ejemplo
-- ==============================================================================

-- 1. ROLES
INSERT INTO roles (id, name, description) VALUES
(1, 'ROLE_ADMIN', 'Administrador del sistema con acceso total'),
(2, 'ROLE_RECEPTIONIST', 'Recepcionista - Atención al cliente, citas y órdenes'),
(3, 'ROLE_MECHANIC', 'Mecánico de taller - Diagnósticos, reparaciones y horas'),
(4, 'ROLE_CUSTOMER', 'Cliente - Visualización de sus vehículos, citas y presupuestos')
ON CONFLICT (id) DO NOTHING;

-- Reiniciar la secuencia para roles
ALTER SEQUENCE roles_id_seq RESTART WITH 5;

-- 2. USUARIOS (Contraseña de prueba para todos: 'password123' hasheada con BCrypt)
-- Hash BCrypt válido de 'password123': $2a$10$rhLD7uODmJL0VpCXkkvXtuetCuM/Ht9GNC2/iFKtVKvXNQFAMuo3m
INSERT INTO users (id, email, password, first_name, last_name, phone, role_id, enabled) VALUES
(1, 'admin@paddock.com', '$2a$10$rhLD7uODmJL0VpCXkkvXtuetCuM/Ht9GNC2/iFKtVKvXNQFAMuo3m', 'Raúl', 'Administrador', '600111222', 1, TRUE),
(2, 'recepcion@paddock.com', '$2a$10$rhLD7uODmJL0VpCXkkvXtuetCuM/Ht9GNC2/iFKtVKvXNQFAMuo3m', 'Laura', 'García', '600333444', 2, TRUE),
(3, 'mecanico1@paddock.com', '$2a$10$rhLD7uODmJL0VpCXkkvXtuetCuM/Ht9GNC2/iFKtVKvXNQFAMuo3m', 'Carlos', 'Mecánico', '600555666', 3, TRUE),
(4, 'mecanico2@paddock.com', '$2a$10$rhLD7uODmJL0VpCXkkvXtuetCuM/Ht9GNC2/iFKtVKvXNQFAMuo3m', 'David', 'Martínez', '600777888', 3, TRUE)
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE users_id_seq RESTART WITH 5;

-- 3. CLIENTES
INSERT INTO customers (id, dni_cif, first_name, last_name, email, phone, address, city, user_id) VALUES
(1, '12345678Z', 'Juan', 'Pérez López', 'juan.perez@email.com', '611223344', 'Calle Mayor 14, 2B', 'Madrid', NULL),
(2, '87654321X', 'Marta', 'Fernández Ruiz', 'marta.fernandez@email.com', '622334455', 'Avenida del Parque 8', 'Madrid', NULL)
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE customers_id_seq RESTART WITH 3;

-- 4. VEHÍCULOS
INSERT INTO vehicles (id, license_plate, vin, brand, model, year, fuel_type, engine, mileage, customer_id) VALUES
(1, '1234ABC', 'WVWZZZ3CZWE123456', 'Volkswagen', 'Golf 2.0 TDI', 2020, 'DIESEL', '2.0 TDI 150cv', 85000, 1),
(2, '5678DEF', 'WBA3A5C50DF987654', 'BMW', 'Serie 3 320d', 2018, 'DIESEL', '2.0d 190cv', 145200, 1),
(3, '9012GHI', 'VF1RFB00861112233', 'Renault', 'Megane TCe', 2021, 'GASOLINE', '1.3 TCe 140cv', 42000, 2)
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE vehicles_id_seq RESTART WITH 4;

-- 5. PIEZAS Y REPUESTOS (INVENTARIO)
INSERT INTO parts (id, reference_code, name, description, manufacturer, stock, min_stock, unit_price, cost_price, supplier) VALUES
(1, 'FIL-ACE-01', 'Filtro de Aceite Mann W712', 'Filtro blindado para grupo VAG y motores diésel', 'Mann-Filter', 25, 5, 14.50, 6.20, 'Recambios Sur'),
(2, 'ACE-5W30-5L', 'Aceite Castrol EDGE 5W30 LL 5L', 'Lubricante sintético LongLife con especificación 504.00/507.00', 'Castrol', 14, 4, 48.00, 28.50, 'Distribuciones LubriAuto'),
(3, 'PAS-DEL-01', 'Pastillas de Freno Delanteras Brembo', 'Juego de pastillas de freno eje delantero con testigo', 'Brembo', 8, 3, 65.00, 32.00, 'Brembo España'),
(4, 'DIS-DEL-01', 'Discos de Freno Delanteros 312mm', 'Pareja de discos ventilados de alto rendimiento', 'Brembo', 4, 2, 110.00, 58.00, 'Brembo España'),
(5, 'BAT-12V-70', 'Batería Tudor High Tech 12V 70Ah', 'Batería de arranque para sistema Start-Stop', 'Tudor', 3, 2, 125.00, 72.00, 'Baterías y Acumuladores SL')
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE parts_id_seq RESTART WITH 6;

-- 6. CITA DE EJEMPLO
INSERT INTO appointments (id, customer_id, vehicle_id, appointment_date_time, reason, observations, status) VALUES
(1, 2, 3, CURRENT_TIMESTAMP + INTERVAL '2 days', 'Revisión anual y cambio de filtros', 'Cliente solicita vehículo de cortesía si es posible', 'CONFIRMADA')
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE appointments_id_seq RESTART WITH 2;

-- 7. ORDEN DE REPARACIÓN EN CURSO (Flujo de ejemplo)
INSERT INTO repair_orders (id, order_number, customer_id, vehicle_id, mechanic_id, entry_date, estimated_delivery_date, mileage_at_entry, customer_issue, observations, priority, status) VALUES
(1, 'ORD-2026-0001', 1, 2, 3, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day', 145200, 'Chirrido agudo al frenar y aviso de mantenimiento en cuadro', 'El cliente deja el vehículo por la mañana', 'HIGH', 'IN_REPAIR')
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE repair_orders_id_seq RESTART WITH 2;

-- 8. DIAGNÓSTICO ASOCIADO
INSERT INTO diagnoses (id, repair_order_id, mechanic_id, symptoms, diagnosis, recommendations, observations) VALUES
(1, 1, 3, 'Ruido metálico al pisar el pedal de freno. Testigo de desgaste encendido.', 'Pastillas de freno delanteras al 10% de vida útil. Aceite de motor degradado con 22.000 km desde último cambio.', 'Sustituir juego de pastillas de freno delanteras y realizar servicio completo de aceite y filtro de aceite.', 'Discos de freno en buen estado, no requieren sustitución.')
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE diagnoses_id_seq RESTART WITH 2;

-- 9. PRESUPUESTO APROBADO
-- Mano de obra: 2.0h x 45€ = 90€
-- Pastillas Brembo: 1 x 65€ = 65€
-- Aceite 5W30: 1 x 48€ = 48€
-- Filtro Aceite: 1 x 14.50€ = 14.50€
-- Subtotal = 217.50€ | IVA (21%) = 45.68€ | Total = 263.18€
INSERT INTO budgets (id, repair_order_id, status, subtotal, tax_rate, tax_amount, total, customer_notes) VALUES
(1, 1, 'APPROVED', 217.50, 21.00, 45.68, 263.18, 'Aprobado telefónicamente por el cliente a las 11:30h')
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE budgets_id_seq RESTART WITH 2;

-- 10. LÍNEAS DE PRESUPUESTO
INSERT INTO budget_items (id, budget_id, item_type, description, quantity, unit_price, total) VALUES
(1, 1, 'LABOR', 'Mano de obra especializada (Mantenimiento y Frenos)', 2.00, 45.00, 90.00),
(2, 1, 'PART', 'Juego de pastillas de freno delanteras Brembo', 1.00, 65.00, 65.00),
(3, 1, 'PART', 'Aceite Castrol EDGE 5W30 LL 5L', 1.00, 48.00, 48.00),
(4, 1, 'PART', 'Filtro de Aceite Mann W712', 1.00, 14.50, 14.50)
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE budget_items_id_seq RESTART WITH 5;

-- 11. PIEZAS UTILIZADAS EN LA REPARACIÓN
INSERT INTO repair_order_parts (id, repair_order_id, part_id, quantity_used, unit_price_applied) VALUES
(1, 1, 3, 1, 65.00),
(2, 1, 2, 1, 48.00),
(3, 1, 1, 1, 14.50)
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE repair_order_parts_id_seq RESTART WITH 4;

-- 12. REGISTRO DE TRABAJO (WORK LOG)
INSERT INTO work_logs (id, repair_order_id, mechanic_id, work_description, hours_spent, date_worked) VALUES
(1, 1, 3, 'Diagnosis inicial, inspección visual de frenos y subida a elevador.', 0.50, CURRENT_DATE),
(2, 1, 3, 'Vaciado de cárter, sustitución de filtro y llenado de aceite 5W30.', 0.75, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE work_logs_id_seq RESTART WITH 3;

-- 13. HISTORIAL DE CAMBIO DE ESTADOS
INSERT INTO status_history (id, repair_order_id, previous_status, new_status, changed_by_user_id, notes) VALUES
(1, 1, NULL, 'RECEIVED', 2, 'Vehículo recepcionado en taller por recepcionista'),
(2, 1, 'RECEIVED', 'DIAGNOSIS', 3, 'Mecánico asignado comienza inspección'),
(3, 1, 'DIAGNOSIS', 'QUOTE_PENDING', 3, 'Diagnóstico completado y enviado para presupuesto'),
(4, 1, 'QUOTE_PENDING', 'APPROVED', 2, 'Presupuesto validado y aceptado por el cliente'),
(5, 1, 'APPROVED', 'IN_REPAIR', 3, 'Comienzan los trabajos de reparación')
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE status_history_id_seq RESTART WITH 6;
