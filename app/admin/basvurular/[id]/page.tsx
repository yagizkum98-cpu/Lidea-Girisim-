import { requirePanelSession } from "@/lib/auth";
import PanelContent from "./PanelContent";

export default async function Page() {
  await requirePanelSession("admin");
  return <PanelContent />;
}
