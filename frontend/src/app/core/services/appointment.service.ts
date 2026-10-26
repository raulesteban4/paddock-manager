import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Page } from '../models/api-response.model';
import { Appointment, AppointmentRequest, AppointmentStatus } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/appointments`;

  getAppointments(
    status?: AppointmentStatus,
    customerId?: number,
    vehicleId?: number,
    page: number = 0,
    size: number = 10
  ): Observable<ApiResponse<Page<Appointment>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) params = params.set('status', status);
    if (customerId) params = params.set('customerId', customerId.toString());
    if (vehicleId) params = params.set('vehicleId', vehicleId.toString());

    return this.http.get<ApiResponse<Page<Appointment>>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<Appointment>> {
    return this.http.get<ApiResponse<Appointment>>(`${this.baseUrl}/${id}`);
  }

  create(request: AppointmentRequest): Observable<ApiResponse<Appointment>> {
    return this.http.post<ApiResponse<Appointment>>(this.baseUrl, request);
  }

  update(id: number, request: AppointmentRequest): Observable<ApiResponse<Appointment>> {
    return this.http.put<ApiResponse<Appointment>>(`${this.baseUrl}/${id}`, request);
  }

  changeStatus(id: number, status: AppointmentStatus): Observable<ApiResponse<Appointment>> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<ApiResponse<Appointment>>(`${this.baseUrl}/${id}/status`, null, { params });
  }

  cancel(id: number): Observable<ApiResponse<Appointment>> {
    return this.http.patch<ApiResponse<Appointment>>(`${this.baseUrl}/${id}/cancel`, null);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}

