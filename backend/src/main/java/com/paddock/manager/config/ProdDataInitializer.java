package com.paddock.manager.config;

import com.paddock.manager.modules.user.entity.Role;
import com.paddock.manager.modules.user.entity.User;
import com.paddock.manager.modules.user.repository.RoleRepository;
import com.paddock.manager.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Inicializador idempotente de roles y usuarios base para entornos de producción.
 * Garantiza que la aplicación disponga de los roles del sistema y las cuentas
 * de demostración incluso si la base de datos parte completamente vacía.
 */
@Slf4j
@Component
@Profile("prod")
@RequiredArgsConstructor
public class ProdDataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        Role adminRole = ensureRole("ROLE_ADMIN", "Administrador del sistema con acceso total");
        Role receptionistRole = ensureRole("ROLE_RECEPTIONIST", "Recepcionista - Atención al cliente, citas y órdenes");
        Role mechanicRole = ensureRole("ROLE_MECHANIC", "Mecánico de taller - Diagnósticos, reparaciones y horas");
        ensureRole("ROLE_CUSTOMER", "Cliente - Visualización de sus vehículos, citas y presupuestos");

        ensureUser("admin@paddock.com", "Raúl", "Administrador", "600111222", adminRole);
        ensureUser("recepcion@paddock.com", "Laura", "García", "600333444", receptionistRole);
        ensureUser("mecanico1@paddock.com", "Carlos", "Mecánico", "600555666", mechanicRole);
        ensureUser("mecanico2@paddock.com", "David", "Martínez", "600777888", mechanicRole);

        log.info("Inicialización de datos base de producción verificada correctamente.");
    }

    private Role ensureRole(String name, String description) {
        return roleRepository.findByName(name)
                .orElseGet(() -> {
                    log.info("Creando rol inicial: {}", name);
                    return roleRepository.save(Role.builder()
                            .name(name)
                            .description(description)
                            .build());
                });
    }

    private void ensureUser(String email, String firstName, String lastName, String phone, Role role) {
        if (userRepository.findByEmail(email).isEmpty()) {
            log.info("Creando usuario demo inicial: {}", email);
            userRepository.save(User.builder()
                    .email(email)
                    .password(passwordEncoder.encode("password123"))
                    .firstName(firstName)
                    .lastName(lastName)
                    .phone(phone)
                    .role(role)
                    .enabled(true)
                    .build());
        }
    }
}
