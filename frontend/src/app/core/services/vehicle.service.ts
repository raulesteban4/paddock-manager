import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Page } from '../models/api-response.model';
import { Vehicle, VehicleRequest } from '../models/vehicle.model';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vehicles`;

  getVehicles(search?: string, page: number = 0, size: number = 10, sort: string = 'id,desc'): Observable<ApiResponse<Page<Vehicle>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<ApiResponse<Page<Vehicle>>>(this.baseUrl, { params });
  }

  getVehicleById(id: number): Observable<ApiResponse<Vehicle>> {
    return this.http.get<ApiResponse<Vehicle>>(`${this.baseUrl}/${id}`);
  }

  getVehicleByPlate(licensePlate: string): Observable<ApiResponse<Vehicle>> {
    return this.http.get<ApiResponse<Vehicle>>(`${this.baseUrl}/by-plate/${licensePlate}`);
  }

  getVehiclesByCustomer(customerId: number): Observable<ApiResponse<Vehicle[]>> {
    return this.http.get<ApiResponse<Vehicle[]>>(`${this.baseUrl}/by-customer/${customerId}`);
  }

  createVehicle(vehicle: VehicleRequest): Observable<ApiResponse<Vehicle>> {
    return this.http.post<ApiResponse<Vehicle>>(this.baseUrl, vehicle);
  }

  updateVehicle(id: number, vehicle: VehicleRequest): Observable<ApiResponse<Vehicle>> {
    return this.http.put<ApiResponse<Vehicle>>(`${this.baseUrl}/${id}`, vehicle);
  }

  deleteVehicle(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}