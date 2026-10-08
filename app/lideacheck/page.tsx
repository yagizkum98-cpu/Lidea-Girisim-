import { requirePanelSession } from "@/lib/auth";
import PanelNavigation from "@/components/PanelNavigation";
import LideaCheckPanel from "./LideaCheckPanel";

export default async function LideaCheckPage() {
  const user = await requirePanelSession("lideacheck");
  return <><PanelNavigation allPanels name={user.name} /><LideaCheckPanel /></>;
}
