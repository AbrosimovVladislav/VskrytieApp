const BASE_URL = "https://v1.hockey.api-sports.io";

function getApiKey(): string {
  const key = process.env.SPORTS_API_KEY;
  if (!key) throw new Error("SPORTS_API_KEY is not set");
  return key;
}

export async function sportsApiGet<T>(
  endpoint: string,
  params?: Record<string, string | number>,
): Promise<T> {
  const url = new URL(endpoint, BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-apisports-key": getApiKey(),
    },
  });

  if (!res.ok) {
    throw new Error(`API-Sports ${endpoint} failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return json.response as T;
}
