// src/drive/routes.ts
import { Hono } from "hono";
import { forward } from "./handlers";

const app = new Hono();

// Drive Routes
app.get("/v3/files", forward);
app.get("/v3/files/:fileId", forward);
app.post("/v3/files", forward);
app.patch("/v3/files/:fileId", forward);
app.post("/v3/files/:fileId/comments", forward);
app.delete("/v3/files/:fileId/comments/:commentId", forward);
app.get("/v3/files/:fileId/comments/:commentId", forward);
app.get("/v3/files/:fileId/comments", forward);
app.patch("/v3/files/:fileId/comments/:commentId", forward);
app.post("/v3/files/:fileId/comments/:commentId/replies", forward);
app.delete("/v3/files/:fileId/comments/:commentId/replies/:replyId", forward);
app.get("/v3/files/:fileId/comments/:commentId/replies/:replyId", forward);
app.get("/v3/files/:fileId/comments/:commentId/replies", forward);
app.patch("/v3/files/:fileId/comments/:commentId/replies/:replyId", forward);

export default app;
