import { z } from "zod";

export const profileSectors = ["Yazılım / SaaS", "Yapay Zeka", "Fintek", "Sağlık Teknolojileri", "Eğitim Teknolojileri", "Tarım ve Gıda", "Turizm", "Enerji", "Sürdürülebilirlik", "E-ticaret", "Oyun", "Üretim", "Diğer"] as const;
export const profileStages = Array.from({ length: 9 }, (_, index) => `TRL ${index + 1}`);
export const maxLogoBytes = 1024 * 1024;
const text = z.string().trim().max(5000);
function validLogo(value: string) {
  if (!value) return true;
  const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;
  try {
    const binary = atob(match[2]);
    if (binary.length > maxLogoBytes) return false;
    return match[1] === "png"
      ? [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => binary.charCodeAt(index) === byte)
      : binary.charCodeAt(0) === 255 && binary.charCodeAt(1) === 216 && binary.charCodeAt(2) === 255;
  } catch { return false; }
}
export const startupProfileSchema = z.object({
  name: z.string().trim().min(1, "Girişim adı zorunludur.").max(160).optional(),
  founder: z.string().trim().min(1, "Kurucu adı zorunludur.").max(160).optional(),
  logo: z.string().max(1_400_000).refine(validLogo, "En fazla 1 MB boyutunda PNG veya JPG görsel yükleyin.").optional(),
  sector: z.enum(profileSectors).optional(),
  stage: z.string().refine((value) => profileStages.includes(value), "TRL seviyesi seçin.").optional(),
  website: z.string().trim().max(500).refine((value) => value === "" || (() => { try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; } })(), "Geçerli bir http/https adresi girin.").optional(),
  problem: text.optional(), solution: text.optional(), businessModel: text.optional(), traction: text.optional(),
  members: z.array(z.object({ id: z.string().max(100), name: z.string().trim().min(1).max(160), role: z.string().trim().min(1).max(160), title: z.string().trim().max(160), active: z.boolean() })).max(30).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Kaydedilecek alan bulunamadı.");
export type StartupProfilePatch = z.infer<typeof startupProfileSchema>;
