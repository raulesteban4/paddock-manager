package com.paddock.manager.modules.health;

import com.paddock.manager.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/health")
@Tag(name = "Health", description = "Endpoints de verificación de estado y conectividad de la API")
public class HealthController {

    @Value("${spring.application.name:paddock-manager-api}")
    private String appName;

    @GetMapping
    @Operation(summary = "Comprobar estado del servicio", description = "Devuelve el estado operativo de la API REST.")
    public ResponseEntity<ApiResponse<HealthStatusResponse>> checkHealth() {
        HealthStatusResponse health = HealthStatusResponse.builder()
                .status("UP")
                .application(appName)
                .version("1.0.0")
                .environment("development")
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.ok(ApiResponse.success("Servicio operativo", health));
    }
}
