export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

export async function apiRequest<T>(
  path: string,
  token?: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", "Bearer " + token);

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/${path.replace(/^\//, "")}`, { ...options, headers });
  } catch {
    throw new ApiError(`Cannot reach the LifeTrack API at ${apiBaseUrl}. Check that the backend is running.`, 0);
  }

  const text = await response.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError("The API returned an invalid response.", response.status);
  }

  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null && "message" in payload
      ? String(payload.message)
      : `Request failed (${response.status}).`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}
