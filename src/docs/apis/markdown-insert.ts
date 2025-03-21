import { Context } from "hono";
import { forward, SERVICE_ENDPOINT } from "./forward";
// Import marked library (needs to be added as a dependency)
import { marked } from 'marked';

// Get markdown content from the request - either from JSON or as plain text
async function getMarkdownFromRequest(c: Context): Promise<string | null> {
  // Get the raw request body
  const requestBody = await c.req.text();
  console.log("Request body length:", requestBody.length);
  
  // Check content-type header to determine how to handle the request
  const contentType = c.req.header('content-type');
  console.log("Content-Type:", contentType);
  
  // If content-type is application/json, try to parse as JSON
  if (contentType?.includes('application/json')) {
    try {
      const json = JSON.parse(requestBody);
      if (json && json.markdown) {
        console.log("Successfully extracted markdown from JSON");
        return json.markdown;
      } else {
        console.log("JSON parsed but no 'markdown' field found");
        return null;
      }
    } catch (error) {
      // If JSON parsing fails, log error but continue to treat as plain text
      console.error("JSON parsing failed:", (error as Error).message);
      // Fall through to treat as plain text
    }
  }
  
  // If not JSON or JSON parsing failed, treat the entire request body as markdown
  console.log("Treating request body as plain markdown text");
  return requestBody;
}

// convert markdown to Google Docs format, then apply batchUpdate
export const markdownInsert = async (
  c: Context,
) => {
  try {
    // Get markdown content from the request
    const markdown = await getMarkdownFromRequest(c);
    
    if (!markdown) {
      return c.json({ 
        error: "Invalid request: Could not extract markdown content" 
      }, 400);
    }
    
    console.log("Successfully got markdown, length:", markdown.length);
    
    // Parse the markdown to get tokens
    const tokens = marked.lexer(markdown);
    
    // Debug: Log tokens structure
    console.log("Markdown tokens:", JSON.stringify(tokens.slice(0, 2), null, 2));
    
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
          // Check for inline tokens like bold/italic
          if (token.tokens) {
            let paragraphText = '';
            const formattingRequests = [];
            let currentIndex = index;
            
            // Process inline tokens
            for (const inlineToken of token.tokens) {
              if (inlineToken.type === 'text') {
                paragraphText += inlineToken.text;
                currentIndex += inlineToken.text.length;
              }
              else if (inlineToken.type === 'strong') {
                const boldText = inlineToken.text;
                paragraphText += boldText;
                
                // Debug strong token
                console.log("Processing strong token:", JSON.stringify(inlineToken));
                console.log("Current index:", currentIndex);
                
                // Add bold formatting
                formattingRequests.push({
                  updateTextStyle: {
                    textStyle: {
                      bold: true
                    },
                    range: {
                      startIndex: currentIndex,
                      endIndex: currentIndex + boldText.length
                    },
                    fields: "bold"
                  }
                });
                
                currentIndex += boldText.length;
              }
              else if (inlineToken.type === 'em') {
                const italicText = inlineToken.text;
                paragraphText += italicText;
                
                // Add italic formatting
                formattingRequests.push({
                  updateTextStyle: {
                    textStyle: {
                      italic: true
                    },
                    range: {
                      startIndex: currentIndex,
                      endIndex: currentIndex + italicText.length
                    },
                    fields: "italic"
                  }
                });
                
                currentIndex += italicText.length;
              }
              else if (inlineToken.type === 'link') {
                const linkText = inlineToken.text;
                paragraphText += linkText;
                
                // Add link formatting
                formattingRequests.push({
                  updateTextStyle: {
                    textStyle: {
                      link: {
                        url: inlineToken.href
                      }
                    },
                    range: {
                      startIndex: currentIndex,
                      endIndex: currentIndex + linkText.length
                    },
                    fields: "link"
                  }
                });
                
                currentIndex += linkText.length;
              }
              else {
                // Handle other inline types if needed
                paragraphText += inlineToken.raw;
                currentIndex += inlineToken.raw.length;
              }
            }
            
            // Add paragraph with newline
            paragraphText += '\n';
            requests.push({
              insertText: {
                text: paragraphText,
                endOfSegmentLocation: {}
              }
            });
            
            // Add formatting requests
            requests.push(...formattingRequests);
            
            index += paragraphText.length;
          } else {
            // Simple paragraph without special formatting
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
            
            // Create bullet or numbered list - use the correct preset value
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
          // For tables, we need to convert to plain text with proper formatting
          // since directly manipulating table cells is causing insertion index errors
          
          // Insert table header
          let tableText = "| ";
          for (const header of token.header) {
            const headerText = header.text || header;
            tableText += headerText + " | ";
          }
          tableText += "\n| ";
          
          // Insert separator row
          for (let i = 0; i < token.header.length; i++) {
            tableText += "--- | ";
          }
          tableText += "\n";
          
          // Insert table rows
          for (const row of token.rows) {
            tableText += "| ";
            for (const cell of row) {
              const cellText = cell.text || cell || "";
              tableText += cellText + " | ";
            }
            tableText += "\n";
          }
          
          // Insert the table as text
          requests.push({
            insertText: {
              text: tableText + "\n",
              endOfSegmentLocation: {}
            }
          });
          
          // Format table text with monospace font to maintain alignment
          requests.push({
            updateTextStyle: {
              textStyle: {
                weightedFontFamily: {
                  fontFamily: "Consolas"
                }
              },
              range: {
                startIndex: index,
                endIndex: index + tableText.length
              },
              fields: "weightedFontFamily"
            }
          });
          
          index += tableText.length + 1; // +1 for the extra newline
          break;
          
        case 'space':
          // Insert empty line
          requests.push({
            insertText: {
              text: '\n',
              endOfSegmentLocation: {}
            }
          });
          index += 1;
          break;
          
        default:
          // For any unhandled token types, insert as plain text
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

    // step 2: apply batchUpdate
    const documentId = c.req.param("documentId");
    const path = `/v1/documents/${documentId}:batchUpdate`;
    const url = `${SERVICE_ENDPOINT}${path}`;
    return forward(c, undefined, { url, body: { requests } });
  } catch (error) {
    console.error("Error in markdownInsert:", error);
    return c.json({ 
      error: "Failed to convert markdown to Google Docs format", 
      details: (error as Error).message 
    }, 500);
  }
};
