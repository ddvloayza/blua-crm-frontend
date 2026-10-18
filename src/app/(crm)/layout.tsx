import { CrmProvider } from "@/context/CrmContext";
import { CrmShell } from "@/components/crm/CrmShell";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return <CrmProvider><CrmShell>{children}</CrmShell></CrmProvider>;
}
