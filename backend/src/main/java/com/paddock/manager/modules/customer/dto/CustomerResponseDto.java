package com.paddock.manager.modules.customer.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO que representa la información pública devuelta de un cliente.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Información del cliente devuelta por la API")
public class CustomerResponseDto {

    @Schema(description = "ID único del cliente", example = "1")
    private Long id;

    @Schema(description = "Documento de identidad / CIF", example = "12345678Z")
    private String dniCif;

    @Schema(description = "Nombre", example = "Juan")
    private String firstName;

    @Schema(description = "Apellidos", example = "Pérez López")
    private String lastName;

    @Schema(description = "Nombre completo", example = "Juan Pérez López")
    private String fullName;

    @Schema(description = "Correo electrónico", example = "juan.perez@email.com")
    private String email;

    @Schema(description = "Teléfono de contacto", example = "611223344")
    private String phone;

    @Schema(description = "Dirección postal", example = "Calle Mayor 14, 2B")
    private String address;

    @Schema(description = "Ciudad", example = "Madrid")
    private String city;

    @Schema(description = "ID de usuario de acceso al portal (si aplica)", example = "null")
    private Long userId;

    @Schema(description = "Fecha de registro en el taller")
    private LocalDateTime createdAt;

    @Schema(description = "Fecha de última modificación")
    private LocalDateTime updatedAt;
}