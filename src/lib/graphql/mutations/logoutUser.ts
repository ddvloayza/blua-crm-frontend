export async function logoutUser(): Promise<boolean> {
  const endpoint = process.env.NEXT_PUBLIC_LOGOUT_ENDPOINT;
  if (!endpoint) return false;
  try {
    const response = await fetch(endpoint, { method: "POST", credentials: "include" });
    return response.ok;
  } catch {
    return false;
  }
}
