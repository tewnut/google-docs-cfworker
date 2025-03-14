// src/sheets/routes.ts
import { Hono } from "hono";
import { batchUpdateSpreadsheet, forward, sheetCopyTo } from "./handlers";

const app = new Hono();

// Sheets Routes
app.post("/v4/spreadsheets", forward);
app.post("/v4/spreadsheets/:spreadsheetId/batchUpdate", batchUpdateSpreadsheet);
app.post("/v4/spreadsheets/:spreadsheetId/sheets/:sheetId/copyTo", sheetCopyTo);
app.get("/v4/spreadsheets/:spreadsheetId/values:batchGet", forward);
app.post("/v4/spreadsheets/:spreadsheetId/values:batchUpdate", forward);
app.post("/v4/spreadsheets/:spreadsheetId/values:batchClear", forward);

export default app;
