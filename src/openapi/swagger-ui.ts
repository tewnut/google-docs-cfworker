import { Context } from "hono";
import { setCookie } from "hono/cookie";

export async function ui(c: Context) {
    const accessToken = c.req.query('access_token');
    const error = c.req.query('error');
    const spec = c.req.param('spec') || 'swagger.yaml';    
    // Store the current path as the redirect path for OAuth
    const currentPath = `/swagger/${spec}`;
    // Set the cookie when the UI loads - this ensures the cookie is set even when
    // the user initiates OAuth directly from the Swagger UI
    setCookie(c, 'oauth_redirect_path', currentPath, {
      path: '/',
      httpOnly: true,
      secure: c.req.url.startsWith('https'),
      maxAge: 60 * 10 // 10 minutes
    });
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>API Documentation</title>
          <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
          <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
      </head>
      <body>
          <div id="swagger-ui"></div>
          <script>
              window.onload = () => {
                  window.ui = SwaggerUIBundle({
                      url: '/openapi/${spec}',
                      dom_id: '#swagger-ui',
                      presets: [
                          SwaggerUIBundle.presets.apis,
                          SwaggerUIBundle.SwaggerUIStandalonePreset
                      ],
                      ${accessToken ? `requestInterceptor: (req) => {
                          req.headers.Authorization = 'Bearer ${accessToken}';
                          return req;
                      },` : ''}
                  });
                  ${error ? `alert(${JSON.stringify(error)})` : ''}
              };
          </script>
      </body>
      </html>
    `;
    return c.html(html);
}