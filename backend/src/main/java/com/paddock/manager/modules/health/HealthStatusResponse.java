package com.paddock.manager.modules.health;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthStatusResponse {
    private String status;
    private String application;
    private String version;
    private String environment;
    private LocalDateTime timestamp;
}
