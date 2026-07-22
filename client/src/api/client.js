async function request(path, options = {}, unwrap = true) {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    ...options,
    headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
  });
  if (response.status === 204) return null;
  const result = await response.json().catch(() => ({ message: "Invalid server response." }));
  if (!response.ok) {
    const error = new Error(result.message || `Request failed (${response.status}).`);
    error.status = response.status; error.code = result.code; error.details = result;
    throw error;
  }
  return unwrap ? result.data ?? result : result;
}

export const api = (path, options) => request(path, options, true);
export const apiEnvelope = (path, options) => request(path, options, false);

export const json = (method, body) => ({ method, body: JSON.stringify(body) });
