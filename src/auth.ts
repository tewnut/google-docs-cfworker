// Function to forward query parameters to Google OAuth
export function forwardLogin(c: any) {
  const oauthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  
  // Get existing query parameters
  const params = new URLSearchParams(c.req.query());
  
  // Ensure required parameters are set
  if (!params.has('client_id') && c.env.GOOGLE_CLIENT_ID) {
    params.set('client_id', c.env.GOOGLE_CLIENT_ID);
  }
  
  if (!params.has('redirect_uri')) {
    params.set('redirect_uri', `${new URL(c.req.url).origin}/oauth2-redirect.html`);
  }
  
  if (!params.has('response_type')) {
    params.set('response_type', 'code');
  }
  
  if (!params.has('scope')) {
    params.set('scope', 'https://www.googleapis.com/auth/drive');
  }
  
  // Add additional required parameters for Google OAuth compliance
  if (!params.has('access_type')) {
    params.set('access_type', 'offline');
  }
  
  if (!params.has('prompt')) {
    params.set('prompt', 'consent');
  }
  
  oauthUrl.search = params.toString();
  return c.redirect(oauthUrl.toString());
}

// Function to forward the token exchange request to Google Token endpoint
export async function forwardToken(c: any) {
  const tokenUrl = new URL("https://oauth2.googleapis.com/token");
  const body = await c.req.text();
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET; // Fetch from environment variable
  if (!clientSecret)
    return c.json({ error: "GOOGLE_CLIENT_SECRET is not set" }, 500);
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

// Function to handle OAuth callback
export async function handleCallback(c: any) {
  const code = c.req.query('code');
  const error = c.req.query('error');

  if (error) {
    console.error(error)
    return c.redirect(`/docs?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return c.redirect('/docs?error=No authorization code received');
  }

  // Exchange the code for tokens
  const tokenUrl = new URL("https://oauth2.googleapis.com/token");
  const clientId = c.env.GOOGLE_CLIENT_ID
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET



  if (!clientId || !clientSecret) {
    return c.redirect('/docs?error=Missing OAuth credentials');
  }

  const tokenResponse = await fetch(tokenUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${new URL(c.req.url).origin}/oauth2-redirect.html`,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json();
    console.error(JSON.stringify(errorData))
    return c.redirect(`/docs?error=${encodeURIComponent(JSON.stringify(errorData))}`);
  }

  const tokens = await tokenResponse.json();

  // Redirect back to docs with the access token
  return c.redirect(`/docs?access_token=${encodeURIComponent((tokens as any).access_token)}`);
}
