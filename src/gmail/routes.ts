// src/gmail/routes.ts
import { Hono } from "hono";
import { forward } from "./handlers";

const app = new Hono();

// Gmail Routes
app.get("/users/:userId/messages", forward);
app.get("/users/:userId/messages/:id", forward);
app.post("/users/:userId/messages/send", forward);
app.get("/users/:userId/settings/vacation", forward);
app.put("/users/:userId/settings/vacation", forward);
app.post("/users/:userId/drafts", forward);
app.get("/users/:userId/drafts/:id", forward);
app.delete("/users/:userId/drafts/:id", forward);
app.put("/users/:userId/drafts/:id", forward);
app.post("/users/:userId/drafts/send", forward);

export default app;
