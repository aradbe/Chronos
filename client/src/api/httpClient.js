const DEFAULT_API_BASE_URL = "http://localhost:3000/api";

const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
};

const buildUrl = (path) => {
  if (path.startsWith("http")) {
    return path;
  }

  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${endpoint}`;
};

const parseResponseBody = async (response) => {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
};

const normalizeError = (response, responseBody) => {
  const serverError = responseBody?.error;

  return {
    message:
      serverError?.message ||
      responseBody?.message ||
      response.statusText ||
      "Request failed",
    code: serverError?.code || "REQUEST_FAILED",
    status: response.status,
    game: responseBody?.game || null,
    guideEvents: responseBody?.guideEvents || [],
  };
};

export const httpClient = async (path, options = {}) => {
  const { body, headers = {}, method = "GET", token, ...restOptions } = options;
  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...restOptions,
  });

  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throw normalizeError(response, responseBody);
  }

  return responseBody;
};
