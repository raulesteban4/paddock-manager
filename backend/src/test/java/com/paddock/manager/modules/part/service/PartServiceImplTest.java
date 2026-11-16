package com.paddock.manager.modules.part.service;

import com.paddock.manager.common.exception.BusinessException;
import com.paddock.manager.common.exception.ResourceNotFoundException;
import com.paddock.manager.modules.part.dto.InventoryStatsDto;
import com.paddock.manager.modules.part.dto.PartRequestDto;
import com.paddock.manager.modules.part.dto.PartResponseDto;
import com.paddock.manager.modules.part.dto.StockAdjustmentDto;
import com.paddock.manager.modules.part.entity.Part;
import com.paddock.manager.modules.part.mapper.PartMapper;
import com.paddock.manager.modules.part.repository.PartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PartServiceImpl - Tests Unitarios con Mockito")
class PartServiceImplTest {

    @Mock
    private PartRepository partRepository;

    @Spy
    private PartMapper partMapper = new PartMapper();

    @InjectMocks
    private PartServiceImpl partService;

    private Part testPart;
    private PartRequestDto testRequestDto;

    @BeforeEach
    void setUp() {
        testPart = Part.builder()
                .id(1L)
                .referenceCode("BOSCH-OIL-01")
                .name("Filtro de Aceite")
                .manufacturer("Bosch")
                .stock(10)
                .minStock(3)
                .costPrice(new BigDecimal("8.00"))
                .unitPrice(new BigDecimal("15.00"))
                .build();

        testRequestDto = PartRequestDto.builder()
                .referenceCode("BOSCH-OIL-01")
                .name("Filtro de Aceite")
                .manufacturer("Bosch")
                .stock(10)
                .minStock(3)
                .costPrice(new BigDecimal("8.00"))
                .unitPrice(new BigDecimal("15.00"))
                .build();
    }

    @Test
    @DisplayName("Debe registrar un nuevo repuesto con referencia en mayúsculas")
    void create_shouldSavePart_whenReferenceIsUnique() {
        when(partRepository.existsByReferenceCodeIgnoreCase("BOSCH-OIL-01")).thenReturn(false);
        when(partRepository.save(any(Part.class))).thenAnswer(i -> {
            Part p = i.getArgument(0);
            p.setId(10L);
            return p;
        });

        PartResponseDto response = partService.create(testRequestDto);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getReferenceCode()).isEqualTo("BOSCH-OIL-01");
        assertThat(response.getStock()).isEqualTo(10);
        verify(partRepository).save(any(Part.class));
    }

    @Test
    @DisplayName("Debe lanzar BusinessException si la referencia ya existe al crear")
    void create_shouldThrowBusinessException_whenReferenceAlreadyExists() {
        when(partRepository.existsByReferenceCodeIgnoreCase("BOSCH-OIL-01")).thenReturn(true);

        assertThatThrownBy(() -> partService.create(testRequestDto))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Ya existe un repuesto registrado con la referencia");

        verify(partRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe incrementar el stock correctamente con un delta positivo")
    void adjustStock_shouldIncreaseStock_whenPositiveDelta() {
        when(partRepository.findById(1L)).thenReturn(Optional.of(testPart));
        when(partRepository.save(any(Part.class))).thenAnswer(i -> i.getArgument(0));

        StockAdjustmentDto adjustment = StockAdjustmentDto.builder()
                .quantityDelta(5)
                .reason("Recepción de mercancía")
                .build();

        PartResponseDto response = partService.adjustStock(1L, adjustment);

        assertThat(response.getStock()).isEqualTo(15);
        verify(partRepository).save(testPart);
    }

    @Test
    @DisplayName("Debe decrementar el stock correctamente con un delta negativo")
    void adjustStock_shouldDecreaseStock_whenNegativeDeltaIsWithinAvailableStock() {
        when(partRepository.findById(1L)).thenReturn(Optional.of(testPart));
        when(partRepository.save(any(Part.class))).thenAnswer(i -> i.getArgument(0));

        StockAdjustmentDto adjustment = StockAdjustmentDto.builder()
                .quantityDelta(-4)
                .reason("Consumo en reparación")
                .build();

        PartResponseDto response = partService.adjustStock(1L, adjustment);

        assertThat(response.getStock()).isEqualTo(6);
        verify(partRepository).save(testPart);
    }

    @Test
    @DisplayName("Debe rechazar ajuste de stock si el resultado fuese negativo")
    void adjustStock_shouldThrowBusinessException_whenResultingStockIsNegative() {
        when(partRepository.findById(1L)).thenReturn(Optional.of(testPart));

        StockAdjustmentDto adjustment = StockAdjustmentDto.builder()
                .quantityDelta(-15) // stock actual es 10 -> resultado -5
                .reason("Error de inventario")
                .build();

        assertThatThrownBy(() -> partService.adjustStock(1L, adjustment))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("el stock resultante no puede ser negativo");

        verify(partRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe calcular estadísticas globales del inventario y valoraciones económicas")
    void getInventoryStats_shouldCalculateTotalsAndValuations() {
        Part p1 = Part.builder()
                .id(1L)
                .stock(10)
                .minStock(3)
                .costPrice(new BigDecimal("10.00"))
                .unitPrice(new BigDecimal("20.00"))
                .build(); // cost: 100, retail: 200, lowStock: false

        Part p2 = Part.builder()
                .id(2L)
                .stock(2)
                .minStock(5)
                .costPrice(new BigDecimal("50.00"))
                .unitPrice(new BigDecimal("80.00"))
                .build(); // cost: 100, retail: 160, lowStock: true (2 <= 5)

        when(partRepository.findAll()).thenReturn(List.of(p1, p2));

        InventoryStatsDto stats = partService.getInventoryStats();

        assertThat(stats.getTotalParts()).isEqualTo(2);
        assertThat(stats.getLowStockCount()).isEqualTo(1);
        // Cost: 100 + 100 = 200.00
        assertThat(stats.getTotalCostValue()).isEqualByComparingTo(new BigDecimal("200.00"));
        // Retail: 200 + 160 = 360.00
        assertThat(stats.getTotalRetailValue()).isEqualByComparingTo(new BigDecimal("360.00"));
    }

    @Test
    @DisplayName("Debe lanzar ResourceNotFoundException al buscar por ID inexistente")
    void getById_shouldThrowResourceNotFoundException_whenPartNotFound() {
        when(partRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> partService.getById(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
