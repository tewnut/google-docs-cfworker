import { Hono } from "hono";
import { forward } from "./handlers";

const app = new Hono();

// Calendar Routes
app.post("/calendars/primary/events", forward);  // Create a new event
app.get("/calendars/primary/events", forward);   // List events in primary calendar
app.get("/calendars/primary/events/:eventId", forward);  // Get a specific event
app.patch("/calendars/primary/events/:eventId", forward);  // Update a specific event

export default app;
