import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Page } from '../models/api-response.model';
import { Part, PartRequest, StockAdjustment, InventoryStats } from '../models/part.model';

@Injectable({
  providedIn: 'root'
})
export class PartService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/parts`;

  getParts(
    search?: string,
    lowStockOnly?: boolean,
    page: number = 0,
    size: number = 10,
    sort: string = 'name,asc'
  ): Observable<ApiResponse<Page<Part>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    if (lowStockOnly !== undefined && lowStockOnly !== null) {
      params = params.set('lowStockOnly', lowStockOnly.toString());
    }

    return this.http.get<ApiResponse<Page<Part>>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<Part>> {
    return this.http.get<ApiResponse<Part>>(`${this.baseUrl}/${id}`);
  }

  getByReferenceCode(code: string): Observable<ApiResponse<Part>> {
    return this.http.get<ApiResponse<Part>>(`${this.baseUrl}/by-reference/${encodeURIComponent(code)}`);
  }

  getStats(): Observable<ApiResponse<InventoryStats>> {
    return this.http.get<ApiResponse<InventoryStats>>(`${this.baseUrl}/stats`);
  }

  create(dto: PartRequest): Observable<ApiResponse<Part>> {
    return this.http.post<ApiResponse<Part>>(this.baseUrl, dto);
  }

  update(id: number, dto: PartRequest): Observable<ApiResponse<Part>> {
    return this.http.put<ApiResponse<Part>>(`${this.baseUrl}/${id}`, dto);
  }

  adjustStock(id: number, dto: StockAdjustment): Observable<ApiResponse<Part>> {
    return this.http.patch<ApiResponse<Part>>(`${this.baseUrl}/${id}/stock`, dto);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
