import { Context } from "hono";
import { forward, SERVICE_ENDPOINT } from "./forward";
import { marked } from 'marked';
import { decodeBase64 } from "../../utils/decode-base-64";
import { isBase64 } from "../../utils/is-base-64";

// convert markdown to Google Docs format, then apply batchUpdate
export const markdownInsert = async (
  c: Context,
) => {
  try {
    // Get JSON body and extract the base64 encoded markdown
    const body = await c.req.json();
    if (!body || !body.markdown) {
      return c.json({
        error: "Markdown content not found. Please insert markdown as a base64 encoded string in the 'markdown' field."
      }, 400);
    }

    // Decode the base64 markdown using the helper
    const markdown = isBase64(body.markdown) ? decodeBase64(body.markdown) : body.markdown;

    const tokens = marked.lexer(markdown);

    // Conversion state tracking
    let index = 1; // Start at index 1 assuming document already has content
    const requests: any[] = [];

    // Process tokens and convert to Google Docs API requests
    for (const token of tokens) {
      switch (token.type) {
        case 'heading':
          const headingText = token.text + '\n';
          requests.push({
            insertText: {
              text: headingText,
              endOfSegmentLocation: {}
            }
          });

          // Apply heading style based on level
          requests.push({
            updateParagraphStyle: {
              paragraphStyle: {
                namedStyleType: `HEADING_${token.depth}`
              },
              range: {
                startIndex: index,
                endIndex: index + headingText.length
              },
              fields: "namedStyleType"
            }
          });
          index += headingText.length;
          break;

        case 'paragraph':
          if (token.tokens) {
            let paragraphText = '';
            const formattingRequests = [];
            let currentIndex = index;

            for (const inlineToken of token.tokens) {
              if (inlineToken.type === 'text') {
                paragraphText += inlineToken.text;
                currentIndex += inlineToken.text.length;
              }
              else if (inlineToken.type === 'strong') {
                const boldText = inlineToken.text;
                paragraphText += boldText;
                console.log("Processing strong token:", JSON.stringify(inlineToken));
                console.log("Current index:", currentIndex);
                formattingRequests.push({
                  updateTextStyle: {
                    textStyle: { bold: true },
                    range: { startIndex: currentIndex, endIndex: currentIndex + boldText.length },
                    fields: "bold"
                  }
                });
                currentIndex += boldText.length;
              }
              else if (inlineToken.type === 'em') {
                const italicText = inlineToken.text;
                paragraphText += italicText;
                formattingRequests.push({
                  updateTextStyle: {
                    textStyle: { italic: true },
                    range: { startIndex: currentIndex, endIndex: currentIndex + italicText.length },
                    fields: "italic"
                  }
                });
                currentIndex += italicText.length;
              }
              else if (inlineToken.type === 'link') {
                const linkText = inlineToken.text;
                paragraphText += linkText;
                formattingRequests.push({
                  updateTextStyle: {
                    textStyle: { link: { url: inlineToken.href } },
                    range: { startIndex: currentIndex, endIndex: currentIndex + linkText.length },
                    fields: "link"
                  }
                });
                currentIndex += linkText.length;
              }
              else {
                paragraphText += inlineToken.raw;
                currentIndex += inlineToken.raw.length;
              }
            }

            paragraphText += '\n';
            requests.push({
              insertText: {
                text: paragraphText,
                endOfSegmentLocation: {}
              }
            });
            requests.push(...formattingRequests);
            index += paragraphText.length;
          } else {
            const text = token.text + '\n';
            requests.push({
              insertText: {
                text,
                endOfSegmentLocation: {}
              }
            });
            index += text.length;
          }
          break;

        case 'list':
          for (const item of token.items) {
            const listItemText = item.text + '\n';
            requests.push({
              insertText: {
                text: listItemText,
                endOfSegmentLocation: {}
              }
            });
            requests.push({
              createParagraphBullets: {
                range: {
                  startIndex: index,
                  endIndex: index + listItemText.length
                },
                bulletPreset: token.ordered ? 'NUMBERED_DECIMAL_ALPHA_ROMAN' : 'BULLET_DISC_CIRCLE_SQUARE'
              }
            });
            index += listItemText.length;
          }
          break;

        case 'table':
          let tableText = "| ";
          for (const header of token.header) {
            const headerText = header.text || header;
            tableText += headerText + " | ";
          }
          tableText += "\n| ";
          for (let i = 0; i < token.header.length; i++) {
            tableText += "--- | ";
          }
          tableText += "\n";
          for (const row of token.rows) {
            tableText += "| ";
            for (const cell of row) {
              const cellText = cell.text || cell || "";
              tableText += cellText + " | ";
            }
            tableText += "\n";
          }
          requests.push({
            insertText: {
              text: tableText + "\n",
              endOfSegmentLocation: {}
            }
          });
          requests.push({
            updateTextStyle: {
              textStyle: {
                weightedFontFamily: { fontFamily: "Consolas" }
              },
              range: { startIndex: index, endIndex: index + tableText.length },
              fields: "weightedFontFamily"
            }
          });
          index += tableText.length + 1;
          break;

        case 'space':
          requests.push({
            insertText: {
              text: '\n',
              endOfSegmentLocation: {}
            }
          });
          index += 1;
          break;

        default:
          if (token.raw) {
            requests.push({
              insertText: {
                text: token.raw,
                endOfSegmentLocation: {}
              }
            });
            index += token.raw.length;
          }
      }
    }

    console.log(`Generated ${requests.length} requests for Google Docs API`);
    const documentId = c.req.param("documentId");
    const path = `/v1/documents/${documentId}:batchUpdate`;
    const url = `${SERVICE_ENDPOINT}${path}`;
    return forward(c, undefined, { url, body: { requests } });
  } catch (error) {
    console.error(error);
    return c.json({
      error: "Failed to convert markdown to Google Docs format",
      details: (error as Error).message
    }, 500);
  }
};
