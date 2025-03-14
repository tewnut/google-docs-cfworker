import { Context } from "hono";
const SERVICE_ENDPOINT = "https://docs.googleapis.com";

// Default handler to forward requests
export const forward = async (
  c: Context,
  next?: () => Promise<unknown>,
  option?: { url: string }
) => {
  // Extract the full URL path and remove the `/docs` prefix
  const urlParts = new URL(c.req.url);
  const path = urlParts.pathname.replace(/^\/[^/]+/, "");

  // Get all query parameters from the request
  const queryParams = urlParts.searchParams.toString();

  // Construct the full URL to forward the request to
  const url =
    option?.url ||
    `${SERVICE_ENDPOINT}${path}${queryParams ? `?${queryParams}` : ""}`;

  // Get the request headers
  const headers = c.req.header();

  let body;
  if (["POST", "PATCH", "PUT"].includes(c.req.method)) {
    try {
      body = await c.req.json(); // Try to parse JSON only if there is a body
    } catch (error) {
      body = undefined; // If parsing fails or no body, set body to undefined
    }
  }

  const requestOptions: RequestInit = {
    method: c.req.method, // Use the same HTTP method (GET, POST, PATCH, etc.)
    headers: headers, // Forward the same headers
    body: body ? JSON.stringify(body) : undefined,
  };

  try {
    // Make the request to Google Docs API
    console.log(`${c.req.method}: ${url}`, requestOptions);
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    console.log("Response:", data);
    // Return the response data from Google Docs API
    return c.json<any>(data);
  } catch (error) {
    // Handle error if the communication with the Google Docs API fails
    return c.json(
      {
        error: "Failed to communicate with Google Docs API",
        details: (error as Error).message,
      },
      500
    );
  }
};

// Modify the batchUpdate function to forward the request correctly
export const batchUpdate = async (
  c: Context,
  next?: () => Promise<unknown>
) => {
  const documentId = c.req.param("documentId");
  const path = `/v1/documents/${documentId}:batchUpdate`;
  const url = `${SERVICE_ENDPOINT}${path}`;
  return forward(c, next, { url });
};
