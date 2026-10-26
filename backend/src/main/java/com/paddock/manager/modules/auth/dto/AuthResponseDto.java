package com.paddock.manager.modules.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Respuesta de autenticación exitosa con Token JWT")
public class AuthResponseDto {

    @Schema(description = "Token de autenticación JWT")
    private String token;

    @Builder.Default
    @Schema(description = "Tipo de token", example = "Bearer")
    private String type = "Bearer";

    @Schema(description = "ID del usuario", example = "1")
    private Long id;

    @Schema(description = "Correo del usuario", example = "admin@paddock.com")
    private String email;

    @Schema(description = "Nombre completo", example = "Raúl Administrador")
    private String fullName;

    @Schema(description = "Rol asignado", example = "ROLE_ADMIN")
    private String role;
}