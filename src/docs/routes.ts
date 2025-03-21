// src/docs/routes.ts
import { Hono } from "hono";
import { forward } from "./apis/forward";
import { batchUpdate } from "./apis/batch-update";
import { markdownInsert } from "./apis/markdown-insert";


const app = new Hono();

// Docs Routes
app.post("/documents", forward);
app.get("/documents/:documentId", forward);
app.post("/documents/:documentId/batchUpdate", batchUpdate);
app.post("/documents/:documentId/markdown/insert", markdownInsert);

export default app;
