import { Context } from "hono";

export async function ui(c: Context) {

    const accessToken = c.req.query('access_token');
    const error = c.req.query('error');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Google Drive API Documentation</title>
          <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
          <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
      </head>
      <body>
          <div id="swagger-ui"></div>
          <script>
              window.onload = () => {
                  window.ui = SwaggerUIBundle({
                      url: '/swagger.yaml',
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
                  ${error ? `window.ui.showError('${error}');` : ''}
              };
          </script>
      </body>
      </html>
    `;
    return c.html(html);
}