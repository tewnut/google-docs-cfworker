// src/docs/apis/forward.ts
import { Context } from "hono";
export const SERVICE_ENDPOINT = "https://docs.googleapis.com";
// Default handler to forward requests
export const forward = async (
    c: Context,
    next?: () => Promise<unknown>,
    option?: { url: string, method?: string, body?: any }
) => {

    // Remove the first segment of the path (e.g. '/drive' from '/drive/v3/files')
    // to match Google's API endpoint structure
    const urlParts = new URL(c.req.url);
    const path = urlParts.pathname.replace(/^\/[^/]+/, "");

    // Get all query parameters from the request
    const queryParams = urlParts.searchParams.toString();

    // Construct the full URL to forward the request to
    const url =
        option?.url ||
        `${SERVICE_ENDPOINT}/v1${path}${queryParams ? `?${queryParams}` : ""}`;

    const headers = c.req.header();
    const method = (option?.method || c.req.method).toUpperCase();
    let body;

    if (["POST", "PATCH", "PUT"].includes(method)) {
        try {
            body = await c.req.json(); // Try to parse JSON only if there is a body
        } catch (error) {
            body = undefined; // If parsing fails or no body, set body to undefined
        }
    }
    if (option?.body) {
        body = option.body;
    }
    if (["GET", "HEAD"].includes(method)) {
        body = undefined;
    }

    const requestOptions: RequestInit = {
        method,
        headers: headers,
        body: body ? JSON.stringify(body) : undefined,
    };
    try {
        const response = await fetch(url, requestOptions);

        const contentType = response.headers.get('content-type');
        const isJsonResponse = contentType?.includes('application/json');

        // For error responses
        if (!response.ok) {
            try {
                if (isJsonResponse) {
                    const errorData = await response.json() as { error?: { message: string } };
                    console.error(errorData);
                    return c.json({
                        error: errorData.error?.message || 'Unknown error occurred',
                        status: response.status
                    }, response.status as any);
                } else {
                    const textContent = await response.text();
                    console.error(textContent);
                    return c.text(textContent, response.status as any);
                }
            } catch (parseError) {
                return c.text(`API request failed with status ${response.status}`, response.status as any);
            }
        }

        // For successful responses
        try {
            if (isJsonResponse) {
                const data = await response.json();
                console.log("Response:", data);
                return c.json(data as any);
            } else {
                const textContent = await response.text();
                console.log('Response:', textContent);
                return c.text(textContent);
            }
        } catch (error) {
            console.error(error);
            return c.json({
                error: "Failed to parse API response",
                details: (error as Error).message
            }, 500 as any);
        }
    } catch (error) {
        // Handle error if the communication with the Google Docs API fails
        console.error(error);
        return c.json({
            error: "Failed to communicate with Google Docs API",
            details: (error as Error).message
        }, 500 as any);
    }
};