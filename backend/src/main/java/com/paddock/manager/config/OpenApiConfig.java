package com.paddock.manager.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de OpenAPI 3 / Swagger para documentar y probar interactivamente la API.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Paddock Manager API")
                        .version("1.0.0")
                        .description("API REST para la gestión integral de un taller mecánico de automóviles: " +
                                "clientes, vehículos, citas, órdenes de trabajo, diagnósticos, presupuestos e inventario.")
                        .contact(new Contact()
                                .name("Paddock Manager Team")
                                .email("soporte@paddockmanager.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")));
    }
}
