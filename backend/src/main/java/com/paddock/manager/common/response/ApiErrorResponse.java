package com.paddock.manager.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Formato estándar para respuestas de error de la API.
 * Sigue las recomendaciones de RFC 7807 (Problem Details for HTTP APIs).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    private int status;
    private String error;
    private String message;
    private String path;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    // Detalle de errores por campo (especialmente útil para validaciones de @Valid)
    private Map<String, String> validationErrors;
}
