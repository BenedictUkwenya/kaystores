import type { AddressDetails } from "@/types/order";

export type ShippingHub = {
  id: string;
  name: string;
  slug: string;
  address: AddressDetails;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  serviceStates: string[];
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type ShippingHubInput = {
  name: string;
  slug?: string;
  address: AddressDetails;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  serviceStates?: string[];
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};
