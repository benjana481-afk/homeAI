import axios from "axios";

// Change this to your backend IP when testing on a real device
const BASE_URL = "http://localhost:8000/api";

const api = axios.create({ baseURL: BASE_URL });

export interface DesignResult {
  analysis: string;
  redesign_image_url: string;
  design_brief: string;
  style_label: string;
  room_label: string;
}

export interface ShoppingItem {
  name: string;
  description: string;
  category: string;
  store: string;
  store_url: string;
  google_shopping_url: string;
  search_query: string;
  estimated_price_nis: number;
  priority: "essential" | "recommended" | "optional";
}

export interface ShoppingResult {
  items: ShoppingItem[];
  total_essential: number;
  total_recommended: number;
  total_optional: number;
  within_budget: boolean;
  budget_nis: number;
}

export async function generateDesign(
  imageBase64: string,
  roomType: string,
  style: string,
  budgetNis: number
): Promise<DesignResult> {
  // Mobile sends base64 as JSON (different from web which sends FormData)
  const res = await api.post<DesignResult>("/design/generate-base64", {
    image_base64: imageBase64,
    room_type: roomType,
    style,
    budget_nis: budgetNis,
  });
  return res.data;
}

export async function generateShopping(
  designBrief: string,
  roomType: string,
  style: string,
  budgetNis: number
): Promise<ShoppingResult> {
  const res = await api.post<ShoppingResult>("/shopping/generate", {
    design_brief: designBrief,
    room_type: roomType,
    style,
    budget_nis: budgetNis,
  });
  return res.data;
}
