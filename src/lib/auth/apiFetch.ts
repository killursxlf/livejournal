export async function apiFetch(url: string, opts: RequestInit & { token?: string } = {}) {
  const { token, headers, ...rest } = opts;

  const merged = new Headers(headers);
  if (token) merged.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...rest, headers: merged });
  return res;
}
