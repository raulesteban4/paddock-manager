export interface Customer {
  id: number;
  dniCif: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  userId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRequest {
  dniCif: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
}