export interface Part {
  id: number;
  referenceCode: string;
  name: string;
  description?: string;
  manufacturer?: string;
  stock: number;
  minStock: number;
  unitPrice: number;
  costPrice: number;
  supplier?: string;
  lowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartRequest {
  referenceCode: string;
  name: string;
  description?: string;
  manufacturer?: string;
  stock: number;
  minStock: number;
  unitPrice: number;
  costPrice: number;
  supplier?: string;
}

export interface StockAdjustment {
  quantityDelta: number;
  reason?: string;
}

export interface InventoryStats {
  totalParts: number;
  lowStockCount: number;
  totalCostValue: number;
  totalRetailValue: number;
}
