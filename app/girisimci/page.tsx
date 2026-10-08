import { requirePanelSession } from "@/lib/auth";
import { portalUser } from "@/lib/login";
import PanelNavigation from "@/components/PanelNavigation";
import EntrepreneurPanel from "./EntrepreneurPanel";

export default async function EntrepreneurPage() {
  const user = await requirePanelSession("girisimci");
  return <><PanelNavigation allPanels={user.role === "SUPER_ADMIN"} name={user.name} /><EntrepreneurPanel sessionUser={portalUser(user)} /></>;
}
