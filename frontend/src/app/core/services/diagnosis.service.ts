import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { DiagnosisResponseDto, DiagnosisRequestDto } from '../models/diagnosis.model';

@Injectable({
  providedIn: 'root'
})
export class DiagnosisService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/diagnoses`;

  getById(id: number): Observable<ApiResponse<DiagnosisResponseDto>> {
    return this.http.get<ApiResponse<DiagnosisResponseDto>>(`${this.baseUrl}/${id}`);
  }

  getByRepairOrderId(repairOrderId: number): Observable<ApiResponse<DiagnosisResponseDto>> {
    return this.http.get<ApiResponse<DiagnosisResponseDto>>(`${this.baseUrl}/by-order/${repairOrderId}`);
  }

  getByOrderNumber(orderNumber: string): Observable<ApiResponse<DiagnosisResponseDto>> {
    return this.http.get<ApiResponse<DiagnosisResponseDto>>(`${this.baseUrl}/by-order-number/${orderNumber}`);
  }

  create(dto: DiagnosisRequestDto): Observable<ApiResponse<DiagnosisResponseDto>> {
    return this.http.post<ApiResponse<DiagnosisResponseDto>>(this.baseUrl, dto);
  }

  update(id: number, dto: DiagnosisRequestDto): Observable<ApiResponse<DiagnosisResponseDto>> {
    return this.http.put<ApiResponse<DiagnosisResponseDto>>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}

