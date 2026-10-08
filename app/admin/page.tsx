import { requirePanelSession } from "@/lib/auth";
import AdminPanel from "./AdminPanel";

export default async function AdminPage() {
  const user = await requirePanelSession("admin");
  return <AdminPanel sessionUser={{ name: user.name, email: user.email, role: user.role }} />;
}
