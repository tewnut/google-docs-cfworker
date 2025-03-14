import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";
import { forwardLogin, forwardToken } from "./auth";
import docs from "./docs/routes";
import sheets from "./sheets/routes";
import drive from "./drive/routes";
import gmail from "./gmail/routes";
import calendar from './calendar/routes';


const app = new Hono<{ Bindings: CloudflareBindings }>();

// Root endpoint
app.get("/", (c) => c.text("Hi, This is Google API Proxy for ChatAgents!"));

// AUTHENTICATION ROUTES
app.get("/auth2/v2/auth", (c) => forwardLogin(c));
app.post("/auth2/token", (c) => forwardToken(c));

// Mount the subroutes using app.routex
app.route("/docs", docs);
app.route("/spreadsheets", sheets);
app.route("/drive", drive);
app.route("/gmail", gmail);
app.route("calendar", calendar);

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
