import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Page } from '../models/api-response.model';
import { 
  RepairOrder, 
  RepairOrderRequest, 
  RepairOrderStatus, 
  RepairOrderPriority, 
  StatusChangeRequest,
  MechanicSummary 
} from '../models/repair-order.model';

@Injectable({
  providedIn: 'root'
})
export class RepairOrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/repair-orders`;

  getRepairOrders(
    status?: RepairOrderStatus,
    priority?: RepairOrderPriority,
    customerId?: number,
    vehicleId?: number,
    mechanicId?: number,
    search?: string,
    page: number = 0,
    size: number = 10,
    sort: string = 'id,desc'
  ): Observable<ApiResponse<Page<RepairOrder>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (status) params = params.set('status', status);
    if (priority) params = params.set('priority', priority);
    if (customerId) params = params.set('customerId', customerId.toString());
    if (vehicleId) params = params.set('vehicleId', vehicleId.toString());
    if (mechanicId) params = params.set('mechanicId', mechanicId.toString());
    if (search && search.trim()) params = params.set('search', search.trim());

    return this.http.get<ApiResponse<Page<RepairOrder>>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<RepairOrder>> {
    return this.http.get<ApiResponse<RepairOrder>>(`${this.baseUrl}/${id}`);
  }

  getByOrderNumber(orderNumber: string): Observable<ApiResponse<RepairOrder>> {
    return this.http.get<ApiResponse<RepairOrder>>(`${this.baseUrl}/number/${orderNumber}`);
  }

  create(request: RepairOrderRequest): Observable<ApiResponse<RepairOrder>> {
    return this.http.post<ApiResponse<RepairOrder>>(this.baseUrl, request);
  }

  update(id: number, request: RepairOrderRequest): Observable<ApiResponse<RepairOrder>> {
    return this.http.put<ApiResponse<RepairOrder>>(`${this.baseUrl}/${id}`, request);
  }

  changeStatus(id: number, request: StatusChangeRequest): Observable<ApiResponse<RepairOrder>> {
    return this.http.patch<ApiResponse<RepairOrder>>(`${this.baseUrl}/${id}/status`, request);
  }

  assignMechanic(id: number, mechanicId?: number | null): Observable<ApiResponse<RepairOrder>> {
    let params = new HttpParams();
    if (mechanicId) params = params.set('mechanicId', mechanicId.toString());
    return this.http.patch<ApiResponse<RepairOrder>>(`${this.baseUrl}/${id}/assign-mechanic`, null, { params });
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  getMechanics(): Observable<ApiResponse<MechanicSummary[]>> {
    return this.http.get<ApiResponse<MechanicSummary[]>>(`${this.baseUrl}/mechanics`);
  }
}

