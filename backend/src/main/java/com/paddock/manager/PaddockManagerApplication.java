package com.paddock.manager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Paddock Manager - Aplicación Principal Spring Boot
 * Punto de entrada para la API REST de gestión de taller mecánico.
 */
@SpringBootApplication
public class PaddockManagerApplication {

    public static void main(String[] args) {
        SpringApplication.run(PaddockManagerApplication.class, args);
    }
}
