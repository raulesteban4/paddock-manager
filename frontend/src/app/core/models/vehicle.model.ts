export type FuelType = 'GASOLINE' | 'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'LPG';

export interface Vehicle {
  id: number;
  licensePlate: string;
  vin: string;
  brand: string;
  model: string;
  year: number;
  fuelType: FuelType;
  engine?: string;
  mileage: number;
  customerId: number;
  customerName: string;
  customerDni: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleRequest {
  licensePlate: string;
  vin: string;
  brand: string;
  model: string;
  year: number;
  fuelType: FuelType;
  engine?: string;
  mileage: number;
  customerId: number;
}