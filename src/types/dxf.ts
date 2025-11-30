export type MaterialType = "steel" | "stainless" | "aluminum" | "copper";

export interface MaterialInfo {
  name: string;
  thicknesses: number[];
}

export const MATERIALS: Record<MaterialType, MaterialInfo> = {
  steel: {
    name: "Чёрный металл (сталь СТ3)",
    thicknesses: [0.5, 0.8, 1.0, 1.2, 1.5, 2.0, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 20.0, 25.0],
  },
  stainless: {
    name: "Нержавеющая сталь",
    thicknesses: [0.5, 0.8, 1.0, 1.2, 1.5, 2.0, 3.0, 4.0, 5.0],
  },
  aluminum: {
    name: "Алюминий",
    thicknesses: [0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 6.0],
  },
  copper: {
    name: "Медь / Латунь",
    thicknesses: [0.5, 1.0, 1.5, 2.0, 3.0],
  },
};

export interface PricingInfo {
  material: MaterialType;
  thickness: number;
  cutting: number; // ₽ за 1 м резки
  pierce: number; // ₽ за 1 точку врезки
  metal: number; // ₽ за 1 м² металла
  format: string; // формат листа
}

export const PRICING_DATA: PricingInfo[] = [
  // Чёрный металл (сталь)
  { material: "steel", thickness: 1, cutting: 40, pierce: 1.5, metal: 672, format: "1.25×2.5" },
  { material: "steel", thickness: 1.5, cutting: 47, pierce: 2, metal: 998, format: "1.25×2.5" },
  { material: "steel", thickness: 2, cutting: 57, pierce: 3, metal: 1347, format: "1.25×2.5" },
  { material: "steel", thickness: 3, cutting: 65, pierce: 4, metal: 1945, format: "1.25×2.5" },
  { material: "steel", thickness: 4, cutting: 70, pierce: 5, metal: 1970, format: "1.5×3" },
  { material: "steel", thickness: 5, cutting: 85, pierce: 6, metal: 2447, format: "1.5×3" },
  { material: "steel", thickness: 6, cutting: 95, pierce: 8, metal: 2958, format: "1.5×3" },
  { material: "steel", thickness: 8, cutting: 150, pierce: 10, metal: 3740, format: "1.5×3" },
  { material: "steel", thickness: 10, cutting: 205, pierce: 12, metal: 4843, format: "1.5×3" },
  { material: "steel", thickness: 12, cutting: 260, pierce: 14, metal: 5969, format: "1.5×3" },
  { material: "steel", thickness: 14, cutting: 340, pierce: 16, metal: 7070, format: "1.5×3" },
  { material: "steel", thickness: 16, cutting: 450, pierce: 20, metal: 7898, format: "1.5×3" },
  // Добавьте цены для других материалов здесь
];

export function getPricingByThickness(thickness: number, material: MaterialType): PricingInfo | undefined {
  return PRICING_DATA.find(p => p.thickness === thickness && p.material === material);
}

export function getAvailableThicknesses(material: MaterialType): number[] {
  return PRICING_DATA
    .filter(p => p.material === material)
    .map(p => p.thickness)
    .sort((a, b) => a - b);
}

export function isMaterialAvailable(material: MaterialType): boolean {
  return PRICING_DATA.some(p => p.material === material);
}

export interface DxfConfig {
  fileName: string;
  fileContent: string;
  material: MaterialType;
  thickness: number;
  vectorLength: number; // in meters
  price: number;
  sheetArea?: number; // площадь листа в м²
  metalCost?: number; // стоимость металла
  efficiency?: number; // эффективность раскроя в %
  previewImage?: string; // data URL для превью 96x96px
  piercePoints?: number; // количество точек врезки
}

export interface FinishedDxfPart {
  id: string;
  config: DxfConfig;
  createdAt: Date;
}

export function createDefaultDxfConfig(): DxfConfig {
  return {
    fileName: "",
    fileContent: "",
    material: "steel",
    thickness: 1.0,
    vectorLength: 0,
    price: 0,
  };
}

export function calculateDxfPrice(
  vectorLength: number,
  thickness: number,
  material: MaterialType,
  piercePoints: number = 0,
  sheetArea: number = 0
): number {
  const pricing = getPricingByThickness(thickness, material);
  if (!pricing) {
    return 0;
  }

  const cuttingCost = vectorLength * pricing.cutting;
  const pierceCost = piercePoints * pricing.pierce;
  const metalCost = sheetArea * pricing.metal;

  return cuttingCost + pierceCost + metalCost;
}
