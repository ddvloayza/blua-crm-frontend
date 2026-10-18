type GraphqlResult = {
  data?: unknown;
  errors?: { message?: string }[];
};

function authFailure(result: GraphqlResult): boolean {
  return Boolean(result.errors?.some((error) => /authentication|unauthenticated|unauthorized/i.test(error.message || "")));
}

async function refreshSession(): Promise<boolean> {
  const endpoint = process.env.NEXT_PUBLIC_REFRESH_ENDPOINT;
  if (!endpoint) return false;
  try {
    const response = await fetch(endpoint, { method: "POST", credentials: "include" });
    return response.ok;
  } catch {
    return false;
  }
}

export async function graphqlRequest(query: string, variables?: Record<string, unknown>, retry = true): Promise<GraphqlResult> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
  if (!endpoint) throw new Error("Falta configurar NEXT_PUBLIC_GRAPHQL_ENDPOINT.");
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    throw new Error("No se pudo conectar con Django. Revisa la URL del backend y que el servidor esté encendido.");
  }
  if (!response.ok) throw new Error(`El servidor respondió ${response.status}.`);
  const result = await response.json() as GraphqlResult;
  if (authFailure(result)) {
    if (retry && await refreshSession()) return graphqlRequest(query, variables, false);
    if (typeof window !== "undefined" && window.location.pathname !== "/signin") window.location.replace("/signin");
    throw new Error("UNAUTHENTICATED");
  }
  return result;
}
