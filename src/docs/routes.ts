// src/docs/routes.ts
import { Hono } from "hono";
import { forward, batchUpdate } from "./handlers";

const app = new Hono();

// Docs Routes
app.post("/documents", forward);
app.get("/documents/:documentId", forward);
app.post("/documents/:documentId/batchUpdate", batchUpdate);

export default app;
