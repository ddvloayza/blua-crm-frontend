"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

type CrmModalProps = {
  title: string;
  description?: string;
  busy?: boolean;
  wide?: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function CrmModal({ title, description, busy = false, wide = false, onClose, children }: CrmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return <dialog
    ref={dialogRef}
    aria-labelledby={titleId}
    className={`crm-modal${wide ? " crm-modal-wide" : ""}`}
    onCancel={(event) => {
      event.preventDefault();
      if (!busy) onClose();
    }}
  >
    <div className="crm-modal-header">
      <div>
        <div className="crm-kicker">BLUA / CRM</div>
        <h2 id={titleId} className="crm-section-title mt-2">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      <button type="button" onClick={onClose} disabled={busy} aria-label={`Cerrar ${title}`} className="crm-modal-close"><X size={20} /></button>
    </div>
    <div className="crm-modal-body">{children}</div>
  </dialog>;
}
