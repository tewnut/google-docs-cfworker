import { Context } from "hono";
import { forward, SERVICE_ENDPOINT } from "./forward";


export const documentStructure = async (
  c: Context,
) => {
  const documentId = c.req.param("documentId");
  const query = c.req.query();
  const searchParams = new URLSearchParams(query);
  const fields = [
    "title",
    "headers",
    "footers",
    "body.content.startIndex",
    "body.content.endIndex",
    "body.content.paragraph.elements.startIndex",
    "body.content.paragraph.elements.textRun.content",
    "body.content.table.rows",
    "body.content.table.columns",
    "body.content.table.tableRows"
  ]
  if (!searchParams.has("fields")) {
    searchParams.set("fields", fields.join(","));
  }
  const path = `/v1/documents/${documentId}`;
  const url = `${SERVICE_ENDPOINT}${path}?${searchParams.toString()}`;
  return forward(c, undefined, { url });
};
