export async function loginUser(email: string, password: string): Promise<void> {
  const endpoint = process.env.NEXT_PUBLIC_LOGIN_ENDPOINT;
  if (!endpoint) throw new Error("Falta configurar NEXT_PUBLIC_LOGIN_ENDPOINT.");
  const response = await fetch(endpoint, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const text = await response.text();
  let payload: { message?: string; messages?: { message?: string }[] } = {};
  try { payload = text ? JSON.parse(text) : {}; } catch { /* Error HTML del servidor. */ }
  if (!response.ok) throw new Error(payload.message || payload.messages?.[0]?.message || "No pudimos iniciar sesión. Verifica tus credenciales.");
}
