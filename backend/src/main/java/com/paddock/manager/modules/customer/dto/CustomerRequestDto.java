package com.paddock.manager.modules.customer.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO para la creación y edición de clientes.
 * Incluye validaciones declarativas con Bean Validation.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos para crear o actualizar un cliente")
public class CustomerRequestDto {

    @NotBlank(message = "El DNI/CIF es obligatorio")
    @Size(min = 5, max = 20, message = "El DNI/CIF debe tener entre 5 y 20 caracteres")
    @Schema(description = "Documento de identidad o CIF", example = "12345678Z")
    private String dniCif;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
    @Schema(description = "Nombre del cliente", example = "Juan")
    private String firstName;

    @NotBlank(message = "Los apellidos son obligatorios")
    @Size(max = 100, message = "Los apellidos no pueden superar los 100 caracteres")
    @Schema(description = "Apellidos del cliente", example = "Pérez López")
    private String lastName;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El formato de correo electrónico no es válido")
    @Size(max = 100, message = "El email no puede superar los 100 caracteres")
    @Schema(description = "Correo electrónico del cliente", example = "juan.perez@email.com")
    private String email;

    @NotBlank(message = "El teléfono de contacto es obligatorio")
    @Pattern(regexp = "^[+0-9\\s-]{9,20}$", message = "El formato de teléfono debe tener entre 9 y 20 dígitos")
    @Schema(description = "Teléfono de contacto", example = "611223344")
    private String phone;

    @Size(max = 255, message = "La dirección no puede superar los 255 caracteres")
    @Schema(description = "Dirección postal", example = "Calle Mayor 14, 2B")
    private String address;

    @Size(max = 100, message = "La ciudad no puede superar los 100 caracteres")
    @Schema(description = "Ciudad o localidad", example = "Madrid")
    private String city;
}