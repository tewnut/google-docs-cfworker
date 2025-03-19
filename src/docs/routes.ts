// src/docs/routes.ts
import { Hono } from "hono";
import { forward } from "./apis/forward";
import { batchUpdate } from "./apis/batch-update";


const app = new Hono();

// Docs Routes
app.post("/documents", forward);
app.get("/documents/:documentId", forward);
app.post("/documents/:documentId/batchUpdate", batchUpdate);

export default app;
