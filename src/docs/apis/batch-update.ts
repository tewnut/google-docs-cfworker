import { Context } from "hono";
import { forward, SERVICE_ENDPOINT } from "./forward";

// Modify the batchUpdate function to forward the request correctly
export const batchUpdate = async (
    c: Context,
  ) => {
    const documentId = c.req.param("documentId");
    const path = `/v1/documents/${documentId}:batchUpdate`;
    const url = `${SERVICE_ENDPOINT}${path}`;
    return forward(c, undefined, { url });
  };
  