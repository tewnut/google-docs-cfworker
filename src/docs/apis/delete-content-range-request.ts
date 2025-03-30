import { Context } from "hono";
import { forward, SERVICE_ENDPOINT } from "./forward";


export const deleteContentRangeRequest = async (
  c: Context,
) => {
  try {
    const documentId = c.req.param("documentId");

    const path = `/v1/documents/${documentId}`;
    // inspect document length
    const url = `${SERVICE_ENDPOINT}${path}?fields=body.content.endIndex`;
    const docStructure = await forward(c, undefined, { url, method: "GET" });
    const body = await docStructure.json() as { body: { content: { endIndex: number }[] } };

    const endIndex = body.body.content[body.body.content.length - 1].endIndex -1;
    // clear the document
    const clearUrl = `${SERVICE_ENDPOINT}/v1/documents/${documentId}:batchUpdate`;
    const reqBody = await c.req.json() as { range: { startIndex?: number, endIndex?: number } };
    const reqRange = reqBody?.range || {};
    const clearResponse = await forward(c, undefined, {
      url: clearUrl,
      method: "POST",
      body: {
        requests: [
          {
            deleteContentRange: {
              range: {
                startIndex: 1,
                endIndex,
                ...reqRange
              },
            }
          },
        ],
      }
    });
    return clearResponse;
  } catch (error) {
    console.error(error);
    return c.json({
      error: "Failed to delete content range request",
      details: (error as Error).message
    }, 500 as any);
  }
};
