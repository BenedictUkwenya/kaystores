export type ShippingSettings = {
  terminalEnabled: boolean;
  manualEnabled: boolean;
  /** Fee in Naira integers (0 = complimentary). */
  manualFee: number;
  manualLabel: string;
  manualEta: string | null;
};

export type ShippingSettingsInput = Partial<ShippingSettings>;

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  terminalEnabled: true,
  manualEnabled: true,
  manualFee: 0,
  manualLabel: "Kay delivery",
  manualEta: "Kay arranges delivery after quality checks",
};

export const MANUAL_SHIPMENT_ID = "manual";
export const MANUAL_RATE_ID = "manual";
