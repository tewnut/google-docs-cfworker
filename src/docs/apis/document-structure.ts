import { Context } from "hono";
import { forward, SERVICE_ENDPOINT } from "./forward";


export const documentStructure = async (
    c: Context,
  ) => {
    const documentId = c.req.param("documentId");
    const searchParams = c.req.query();
    const path = `/v1/documents/${documentId}`;
    const url = `${SERVICE_ENDPOINT}${path}?${searchParams.toString()}`;
    return forward(c, undefined, { url });
  };
  