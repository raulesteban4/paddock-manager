import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PartService } from './part.service';
import { Part, StockAdjustment, InventoryStats } from '../models/part.model';
import { ApiResponse, Page } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

describe('PartService', () => {
  let service: PartService;
  let httpMock: HttpTestingController;

  const mockPart: Part = {
    id: 1,
    referenceCode: 'FLT-OIL-001',
    name: 'Filtro de Aceite Sintético',
    description: 'Filtro de aceite alto rendimiento',
    manufacturer: 'Bosch',
    supplier: 'AutoDoc',
    stock: 15,
    minStock: 5,
    costPrice: 8.50,
    unitPrice: 16.00,
    lowStock: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PartService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(PartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch parts page with query parameters', () => {
    const mockPage: Page<Part> = {
      content: [mockPart],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
      empty: false
    };

    service.getParts('Filtro', true, 0, 10).subscribe(response => {
      expect(response.success).toBeTrue();
      expect(response.data?.content.length).toBe(1);
      expect(response.data?.content[0].referenceCode).toBe('FLT-OIL-001');
    });

    const req = httpMock.expectOne(req =>
      req.url === `${environment.apiUrl}/parts` &&
      req.params.get('search') === 'Filtro' &&
      req.params.get('lowStockOnly') === 'true'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockPage, message: 'OK', timestamp: '' });
  });

  it('should submit stock adjustment', () => {
    const adjustment: StockAdjustment = {
      quantityDelta: 5,
      reason: 'Recepción de pedido de proveedor'
    };
    const updatedPart: Part = { ...mockPart, stock: 20 };

    service.adjustStock(1, adjustment).subscribe(response => {
      expect(response.success).toBeTrue();
      expect(response.data?.stock).toBe(20);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/parts/1/stock`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(adjustment);
    req.flush({ success: true, data: updatedPart, message: 'Stock actualizado', timestamp: '' });
  });

  it('should get inventory valuation statistics', () => {
    const mockStats: InventoryStats = {
      totalParts: 45,
      lowStockCount: 3,
      totalCostValue: 3200.00,
      totalRetailValue: 5800.00
    };

    service.getStats().subscribe(response => {
      expect(response.success).toBeTrue();
      expect(response.data?.totalParts).toBe(45);
      expect(response.data?.totalRetailValue).toBe(5800.00);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/parts/stats`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockStats, message: 'Estadísticas obtenidas', timestamp: '' });
  });
});
