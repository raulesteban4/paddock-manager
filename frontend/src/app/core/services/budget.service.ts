import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Page } from '../models/api-response.model';
import { Budget, BudgetRequest, BudgetStatus, BudgetStatusChange } from '../models/budget.model';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/budgets`;

  getBudgets(
    status?: BudgetStatus,
    search?: string,
    page: number = 0,
    size: number = 10,
    sort: string = 'id,desc'
  ): Observable<ApiResponse<Page<Budget>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (status) params = params.set('status', status);
    if (search && search.trim()) params = params.set('search', search.trim());

    return this.http.get<ApiResponse<Page<Budget>>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<Budget>> {
    return this.http.get<ApiResponse<Budget>>(`${this.baseUrl}/${id}`);
  }

  getByRepairOrderId(repairOrderId: number): Observable<ApiResponse<Budget>> {
    return this.http.get<ApiResponse<Budget>>(`${this.baseUrl}/by-order/${repairOrderId}`);
  }

  getByOrderNumber(orderNumber: string): Observable<ApiResponse<Budget>> {
    return this.http.get<ApiResponse<Budget>>(`${this.baseUrl}/by-order-number/${orderNumber}`);
  }

  create(dto: BudgetRequest): Observable<ApiResponse<Budget>> {
    return this.http.post<ApiResponse<Budget>>(this.baseUrl, dto);
  }

  update(id: number, dto: BudgetRequest): Observable<ApiResponse<Budget>> {
    return this.http.put<ApiResponse<Budget>>(`${this.baseUrl}/${id}`, dto);
  }

  changeStatus(id: number, dto: BudgetStatusChange): Observable<ApiResponse<Budget>> {
    return this.http.patch<ApiResponse<Budget>>(`${this.baseUrl}/${id}/status`, dto);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}

