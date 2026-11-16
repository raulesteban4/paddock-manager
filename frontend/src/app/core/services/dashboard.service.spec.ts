import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardService } from './dashboard.service';
import { DashboardStats } from '../models/dashboard.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  const mockStats: DashboardStats = {
    vehiclesInWorkshop: 4,
    activeRepairOrders: 5,
    todayAppointments: 2,
    lowStockParts: 1,
    totalApprovedRevenue: 1540.50,
    ordersByStatus: {
      IN_REPAIR: 2,
      DIAGNOSIS: 1,
      QUOTE_PENDING: 1,
      WAITING_FOR_PARTS: 1
    },
    recentOrders: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DashboardService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve workshop dashboard stats from backend', () => {
    const mockApiResponse: ApiResponse<DashboardStats> = {
      success: true,
      data: mockStats,
      message: 'Métricas recuperadas con éxito',
      timestamp: new Date().toISOString()
    };

    service.getStats().subscribe(response => {
      expect(response.success).toBeTrue();
      expect(response.data?.vehiclesInWorkshop).toBe(4);
      expect(response.data?.totalApprovedRevenue).toBe(1540.50);
      expect(response.data?.ordersByStatus['IN_REPAIR']).toBe(2);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard/stats`);
    expect(req.request.method).toBe('GET');
    req.flush(mockApiResponse);
  });
});
