"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { CrmActor, getCrmActor } from "@/lib/crm/api";

type CrmContextValue = {
  actor: CrmActor | null;
  loading: boolean;
  error: string | null;
};

const CrmContext = createContext<CrmContextValue>({ actor: null, loading: true, error: null });

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [actor, setActor] = useState<CrmActor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getCrmActor()
      .then((value) => { if (mounted) setActor(value); })
      .catch((reason) => { if (mounted && reason?.message !== "UNAUTHENTICATED") setError(reason?.message || "No se pudo verificar el acceso al CRM."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return <CrmContext.Provider value={{ actor, loading, error }}>{children}</CrmContext.Provider>;
}

export function useCrm() { return useContext(CrmContext); }
