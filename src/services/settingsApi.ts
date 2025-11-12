// src/lib/settingsApi.ts
import API from "./api"; // veya senin API dosyanın yolu (örnek: "@/lib/API" değilse "../utils/API")

export type General = {
  siteName: string;
  siteDesc: string;
  maintenance: boolean;
  allowRegistrations: boolean;
  faviconUrl?: string | null;
};

export type Security = {
  twoFA: boolean;
  timeout: number;
  maxAttempts: number;
  minLength: number;
};

export type Content = {
  autoMod: boolean;
  requireApproval: boolean;
  allowReviews: boolean;
  maxFileMb: number;
};

export type Seo = {
  titleTpl: string;
  metaDesc: string;
  keywords: string;
  canonical: string;
  ogImage: string;
  twitterType: "summary" | "summary_large_image" | "app" | "player";
  twitterHandle: string;
  genSitemap: boolean;
  jsonLd: boolean;
  analyticsEnabled: boolean;
  analyticsId: string;
};

export type AppSettings = {
  id: string;
  version: number;
  updatedAt: string;
  updatedBy?: string;
  general: General;
  security: Security;
  content: Content;
  seo: Seo;
};

// 🔹 Ayarları getir
export async function getSettings(): Promise<AppSettings> {
  const res = await API.get("/settings");
  return res.data;
}

// 🔹 Ayarları kaydet
export async function updateSettings(payload: AppSettings): Promise<AppSettings> {
  const res = await API.put("/settings", payload);
  return res.data;
}

// 🔹 Favicon dosyası yükleme
export async function uploadFavicon(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await API.post("/settings/favicon", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.url as string;
}
