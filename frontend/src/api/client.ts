import axios from "axios";

// In production (Vercel): set VITE_API_URL=https://your-backend.railway.app
// In dev: leave unset — vite proxy handles /api → localhost:8000
const _base = (import.meta.env.VITE_API_URL ?? "https://backend-production-c81c.up.railway.app").replace(/\/$/, "");
const api = axios.create({ baseURL: `${_base}/api` });

// Attach JWT to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("homai_token");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, drop the stale token so the user is forced back to login
api.interceptors.response.use(
  (resp) => resp,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("homai_token");
      localStorage.removeItem("homai_email");
    }
    return Promise.reject(err);
  }
);

export interface StyleInfo {
  label: string;
  description: string;
  emoji: string;
}

export interface StylesData {
  styles: Record<string, StyleInfo>;
  room_types: Record<string, string>;
}

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
  image_url?: string | null;
}

export interface ShoppingResult {
  items: ShoppingItem[];
  total_essential: number;
  total_recommended: number;
  total_optional: number;
  within_budget: boolean;
  budget_nis: number;
}

export async function fetchStyles(): Promise<StylesData> {
  const res = await api.get<StylesData>("/design/styles");
  return res.data;
}

export async function generateDesign(
  photo: File,
  roomType: string,
  style: string,
  budgetNis: number
): Promise<DesignResult> {
  const form = new FormData();
  form.append("photo", photo);
  form.append("room_type", roomType);
  form.append("style", style);
  form.append("budget_nis", String(budgetNis));
  const res = await api.post<DesignResult>("/design/generate", form, {
    headers: { "Content-Type": "multipart/form-data" },
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
    style: style,
    budget_nis: budgetNis,
  });
  return res.data;
}

// ---------- Auth ----------

export interface AuthResponse {
  access_token: string;
  token_type: string;
  email: string;
}

export async function registerUser(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/register", { email, password });
  return res.data;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/login", { email, password });
  return res.data;
}

// ---------- Saved Designs ----------

export interface SavedDesignSummary {
  id: number;
  room_label: string;
  style_label: string;
  budget_nis: number;
  is_video: boolean;
  original_image_url: string;
  redesign_image_url: string;
  created_at: string;
}

export interface SavedDesignDetail extends SavedDesignSummary {
  room_type: string;
  style: string;
  analysis: string;
  design_brief: string;
  shopping: ShoppingResult;
}

export interface SaveDesignPayload {
  room_type: string;
  style: string;
  room_label: string;
  style_label: string;
  budget_nis: number;
  is_video: boolean;
  original_image_base64: string;
  original_mime_type: string;
  redesign_image_url: string;
  analysis: string;
  design_brief: string;
  shopping: ShoppingResult;
}

export async function saveDesign(payload: SaveDesignPayload): Promise<SavedDesignDetail> {
  const res = await api.post<SavedDesignDetail>("/designs/save", payload);
  return res.data;
}

export async function listMyDesigns(): Promise<SavedDesignSummary[]> {
  const res = await api.get<SavedDesignSummary[]>("/designs/my");
  return res.data;
}

export async function getDesign(id: number): Promise<SavedDesignDetail> {
  const res = await api.get<SavedDesignDetail>(`/designs/${id}`);
  return res.data;
}

export async function deleteDesign(id: number): Promise<void> {
  await api.delete(`/designs/${id}`);
}

// ---------- Edit Design (שלב 2) ----------

export interface EditDesignPayload {
  redesign_image_url: string;
  edit_prompt: string;
  style: string;
  room_type: string;
}

export async function editDesign(payload: EditDesignPayload): Promise<{ redesign_image_url: string }> {
  const response = await api.post('/design/edit', payload);
  return response.data;
}

// ---------- Generate base64 (שלב 5) ----------

export async function generateDesignBase64(payload: {
  room_type: string;
  style: string;
  budget_nis: number;
  image_base64: string;
}): Promise<DesignResult> {
  const response = await api.post<DesignResult>('/design/generate-base64', payload);
  return response.data;
}

// ---------- Designer Studio ----------

export interface DesignerSketchItem {
  id: number;
  project_id: number;
  image_url: string;
  analysis: string;
  notes: string;
  approved: boolean;
  created_at: string;
}

export interface DesignerProjectSummary {
  id: number;
  client_name: string;
  room_type: string;
  notes: string;
  created_at: string;
  total_sketches: number;
  approved_count: number;
}

export interface DesignerProjectDetail extends DesignerProjectSummary {
  sketches: DesignerSketchItem[];
}

export async function listDesignerProjects(): Promise<DesignerProjectSummary[]> {
  const res = await api.get<DesignerProjectSummary[]>("/designer/projects");
  return res.data;
}

export async function createDesignerProject(
  clientName: string, roomType: string, notes: string
): Promise<DesignerProjectDetail> {
  const form = new FormData();
  form.append("client_name", clientName);
  form.append("room_type", roomType);
  form.append("notes", notes);
  const res = await api.post<DesignerProjectDetail>("/designer/projects", form);
  return res.data;
}

export async function getDesignerProject(id: number): Promise<DesignerProjectDetail> {
  const res = await api.get<DesignerProjectDetail>(`/designer/projects/${id}`);
  return res.data;
}

export async function deleteDesignerProject(id: number): Promise<void> {
  await api.delete(`/designer/projects/${id}`);
}

export async function generateDesignerSketch(
  projectId: number, photo: File, notes: string
): Promise<DesignerSketchItem> {
  const form = new FormData();
  form.append("photo", photo);
  form.append("notes", notes);
  const res = await api.post<DesignerSketchItem>(
    `/designer/projects/${projectId}/sketches`, form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}

export async function toggleApproveSketch(sketchId: number): Promise<DesignerSketchItem> {
  const res = await api.patch<DesignerSketchItem>(`/designer/sketches/${sketchId}/approve`);
  return res.data;
}

export async function deleteDesignerSketch(sketchId: number): Promise<void> {
  await api.delete(`/designer/sketches/${sketchId}`);
}

export async function downloadDesignerPdf(projectId: number, clientName: string): Promise<void> {
  const res = await api.get(`/designer/projects/${projectId}/pdf`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `design_${clientName.replace(/\s+/g, "_")}_${projectId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Compare Styles (שלב 4) ----------

export interface CompareResultItem {
  style: string;
  style_label: string;
  redesign_image_url: string;
  analysis: string;
  design_brief: string;
}

export async function compareStyles(payload: {
  room_type: string;
  styles: string[];
  budget_nis: number;
  image_base64: string;
}): Promise<{ room_label: string; results: CompareResultItem[] }> {
  const response = await api.post('/design/compare', payload);
  return response.data;
}
