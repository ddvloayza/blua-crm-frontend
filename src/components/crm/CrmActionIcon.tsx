export type CrmActionKind = "interaction" | "appointment" | "proposal";

export function CrmActionIcon({ kind, size = 80 }: { kind: CrmActionKind; size?: number }) {
  return <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    role="presentation"
    aria-hidden="true"
    className="shrink-0"
  >
    <rect x="1" y="1" width="118" height="118" fill={kind === "appointment" ? "#D1FAE5" : "#E2E8FF"} stroke="#111111" strokeWidth="2" />
    {kind === "interaction" && <>
      <path d="M25 32h70v42H56L39 89V74H25z" fill="#FFFFFF" stroke="#111111" strokeWidth="4" strokeLinejoin="round" />
      <path d="m45 52 11 11 20-21" stroke="#4A63E7" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="95" cy="18" r="10" fill="#34D399" stroke="#111111" strokeWidth="3" />
    </>}
    {kind === "appointment" && <>
      <rect x="23" y="34" width="70" height="62" rx="2" fill="#FFFFFF" stroke="#111111" strokeWidth="4" />
      <path d="M23 53h70M40 25v17M76 25v17" stroke="#111111" strokeWidth="4" strokeLinecap="round" />
      <circle cx="87" cy="83" r="19" fill="#34D399" stroke="#111111" strokeWidth="4" />
      <path d="M87 71v12l8 6" stroke="#111111" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </>}
    {kind === "proposal" && <>
      <path d="M26 25h43l22 22v52H26z" fill="#FFFFFF" stroke="#111111" strokeWidth="4" strokeLinejoin="round" />
      <path d="M69 25v22h22M37 61h25M37 73h31" stroke="#111111" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="79" cy="87" r="20" fill="#4A63E7" stroke="#111111" strokeWidth="3.5" />
      <path d="m72 94 14-14m-10 0h10v10" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </>}
  </svg>;
}
