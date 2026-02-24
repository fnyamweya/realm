const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function buildHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeApiError(data, status) {
  if (!data || typeof data !== "object") {
    return `Cloudflare API error (${status})`;
  }

  const errors = Array.isArray(data.errors)
    ? data.errors.map((entry) => `${entry.code ?? "unknown"}: ${entry.message ?? "unknown error"}`).join("; ")
    : "unknown error";

  return `Cloudflare API error (${status}) - ${errors}`;
}

export function createCloudflareClient() {
  const token = getRequiredEnv("CLOUDFLARE_API_TOKEN");
  const accountId = getRequiredEnv("CLOUDFLARE_ACCOUNT_ID");

  async function request(path, { method = "GET", body, retries = 2 } = {}) {
    const url = `${CLOUDFLARE_API_BASE}${path}`;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const response = await fetch(url, {
        method,
        headers: buildHeaders(token),
        body: body ? JSON.stringify(body) : undefined,
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      const retriableStatus = response.status >= 500 || response.status === 429;
      if (!response.ok || (data && data.success === false)) {
        if (attempt < retries && retriableStatus) {
          await sleep(400 * (attempt + 1));
          continue;
        }
        throw new Error(normalizeApiError(data, response.status));
      }

      return data;
    }

    throw new Error(`Cloudflare API request failed after retries: ${method} ${path}`);
  }

  async function paginate(path, extractResult) {
    const records = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const separator = path.includes("?") ? "&" : "?";
      const data = await request(`${path}${separator}page=${page}&per_page=${perPage}`);
      const chunk = extractResult(data);

      if (!Array.isArray(chunk)) {
        return records;
      }

      records.push(...chunk);

      const info = data?.result_info;
      if (!info || page >= (info.total_pages ?? page) || chunk.length === 0) {
        return records;
      }
      page += 1;
    }
  }

  return {
    accountId,
    request,
    paginate,
  };
}
