import { requirePanelSession } from "@/lib/auth";
import PanelNavigation from "@/components/PanelNavigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePanelSession("admin");
  return <><PanelNavigation allPanels name={user.name} />{children}</>;
}
