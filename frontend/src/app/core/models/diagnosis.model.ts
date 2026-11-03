// ─── Models: Diagnósticos Técnicos ───────────────────────────────────────────

export interface DiagnosisResponseDto {
  id: number;
  repairOrderId: number;
  orderNumber: string;
  mechanicId: number;
  mechanicName: string;
  symptoms: string;
  diagnosis: string;
  recommendations?: string;
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiagnosisRequestDto {
  repairOrderId: number;
  mechanicId?: number | null;
  symptoms: string;
  diagnosis: string;
  recommendations?: string;
  observations?: string;
}

