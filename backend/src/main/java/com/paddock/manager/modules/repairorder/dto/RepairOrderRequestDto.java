package com.paddock.manager.modules.repairorder.dto;

import com.paddock.manager.modules.repairorder.entity.RepairOrderPriority;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.ZonedDateTime;

/**
 * DTO para la creación o modificación de una orden de reparación.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos para la creación o actualización de una Orden de Reparación")
public class RepairOrderRequestDto {

    @NotNull(message = "El cliente es obligatorio")
    @Positive(message = "El ID del cliente debe ser un número positivo")
    @Schema(description = "ID del cliente propietario del vehículo", example = "1")
    private Long customerId;

    @NotNull(message = "El vehículo es obligatorio")
    @Positive(message = "El ID del vehículo debe ser un número positivo")
    @Schema(description = "ID del vehículo que entra al taller", example = "1")
    private Long vehicleId;

    @Schema(description = "ID del mecánico asignado (opcional)", example = "3")
    private Long mechanicId;

    @Schema(description = "Fecha de entrada en taller (por defecto ahora)")
    private ZonedDateTime entryDate;

    @Schema(description = "Fecha estimada de entrega al cliente")
    private ZonedDateTime estimatedDeliveryDate;

    @NotNull(message = "El kilometraje de entrada es obligatorio")
    @PositiveOrZero(message = "El kilometraje debe ser mayor o igual a 0")
    @Schema(description = "Kilometraje marcado en el cuadro al recepcionar el vehículo", example = "145200")
    private Integer mileageAtEntry;

    @NotBlank(message = "El problema reportado por el cliente es obligatorio")
    @Size(min = 5, max = 2000, message = "El problema debe tener entre 5 y 2000 caracteres")
    @Schema(description = "Problema, síntoma o avería descrita por el cliente", example = "Chirrido al frenar y testigo encendido")
    private String customerIssue;

    @Size(max = 2000, message = "Las observaciones no pueden superar 2000 caracteres")
    @Schema(description = "Observaciones de recepción (daños de carrocería, combustible, etc.)")
    private String observations;

    @NotNull(message = "La prioridad es obligatoria")
    @Schema(description = "Nivel de prioridad", example = "MEDIUM")
    @Builder.Default
    private RepairOrderPriority priority = RepairOrderPriority.MEDIUM;
}

