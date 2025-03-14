// Function to forward query parameters to Google OAuth
export function forwardLogin(c: any) {
  const oauthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  oauthUrl.search = new URLSearchParams(c.req.query()).toString();
  return c.redirect(oauthUrl.toString());
}

// Function to forward the token exchange request to Google Token endpoint
export async function forwardToken(c: any) {
  const tokenUrl = new URL("https://oauth2.googleapis.com/token");
  const body = await c.req.text();
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET; // Fetch from environment variable
  const bodyWithClientSecret = `${body}&client_secret=${encodeURIComponent(
    clientSecret
  )}`;

  const headers = c.req.headers
    ? Object.fromEntries(c.req.headers.entries())
    : {};

  headers["Content-Type"] = "application/x-www-form-urlencoded";

  const response = await fetch(tokenUrl.toString(), {
    method: "POST",
    body: bodyWithClientSecret, // Send the updated body with client_secret
    headers: headers, // Forward the headers as is
  });

  if (!response.ok) {
    const errorData = await response.json();
    return c.json(errorData, response.status);
  }

  const data = await response.json();
  return c.json(data);
}
