// src/docs/routes.ts
import { Hono } from "hono";
import { forward, batchUpdate } from "./handlers";

const app = new Hono();

// Docs Routes
app.post("/v1/documents", forward);
app.get("/v1/documents/:documentId", forward);
app.post("/v1/documents/:documentId/batchUpdate", batchUpdate);

export default app;
