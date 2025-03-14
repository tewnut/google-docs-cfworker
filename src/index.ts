import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";
import { forwardLogin, forwardToken } from "./auth";
import docs from "./docs/routes";


const app = new Hono<{ Bindings: CloudflareBindings }>();

// Root endpoint
app.get("/", (c) => c.text("Hi, This is Google API Proxy for ChatAgents!"));

// AUTHENTICATION ROUTES
app.get("/auth2/v2/auth", (c) => forwardLogin(c));
app.post("/auth2/token", (c) => forwardToken(c));

// Mount the subroutes using app.routex
app.route("/v1", docs);

// Static files route
app.all("/public/*", async (c, next) => {
  try {
    await serveStatic({
      path: "./public",
      manifest: c.env.STATIC_MANIFEST,
    })(c, next);
  } catch (error) {
    return c.json({ error: "Error serving static content" }, 500);
  }
});

// Export the Hono app
export default app;
