import { Context } from "hono";

// Google Sheets API base URL
const SHEETS_API_BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets";

// Helper function to make an authenticated request to Google API
async function fetchFromSheetsAPI(
  url: string,
  headers: Record<string, string>,
  params: Record<string, string | string[]> = {}, // Allow params to be arrays
  method: string = "GET",
  body: any = null
) {
  // Log the URL and params for debugging
  console.log("Request:", {
    headers,
    params,
    url,
    method,
    body,
    SHEETS_API_BASE_URL,
  });

  try {
    const requestOptions: RequestInit = {
      method,
      headers,
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    // Convert params to URLSearchParams, handling arrays correctly
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        // If the value is an array, append each item separately
        value.forEach((item) => searchParams.append(key, item));
      } else {
        // If the value is a string, append it directly
        searchParams.append(key, value);
      }
    }

    const response = await fetch(
      `${SHEETS_API_BASE_URL}${url}?${searchParams.toString()}`,
      requestOptions
    );

    const responseBody = await response.json();
    console.log("Response:", {
      status: response.status,
      body: responseBody,
    });

    return responseBody;
  } catch (error) {
    console.error("Error in fetchFromSheetsAPI:", error);
    throw error;
  }
}
// Handler for fetching spreadsheet metadata
export async function getMetadata(c: Context) {
  const spreadsheetId = c.req.param("spreadsheetId"); // Extract spreadsheetId from URL

  try {
    const headers = c.req.header();
    const data = await fetchFromSheetsAPI(`/${spreadsheetId}`, headers, {
      fields: "sheets.properties",
    });
    return c.json<any>(data);
  } catch (error) {
    // Log the error message
    console.error("Error fetching metadata:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
}

// Handler for previewing the first few rows of a sheet
export async function getPreview(c: Context) {
  const spreadsheetId = c.req.param("spreadsheetId"); // Extract spreadsheetId from URL
  const headers = c.req.header();

  try {
    // Step 1: Fetch metadata to get the list of sheets
    const metadata = (await fetchFromSheetsAPI(`/${spreadsheetId}`, headers, {
      fields: "sheets.properties",
    })) as { sheets: { properties: { title: string } }[] };

    // Step 2: Loop through the sheets and fetch the first few rows of each sheet
    const previewData = await Promise.all(
      metadata.sheets.map(async (sheet: any) => {
        try {
          const range =
            c.req.param("range") || `${sheet.properties.title}!A1:T10`;
          // Step 3: Fetch formatted values for the range
          const formattedValues = await fetchFromSheetsAPI(
            `/${spreadsheetId}/values/${range}`,
            headers,
            {
              valueRenderOption: "FORMATTED_VALUE",
            }
          );

          return {
            sheet,
            data: formattedValues, // Return the data or an empty array if no values
          };
        } catch (error) {
          console.error(
            `Error fetching preview for sheet ${sheet.properties.title}:`,
            error
          );
          return {
            sheetTitle: sheet.properties.title,
            data: [],
            error: (error as Error).message,
          };
        }
      })
    );

    console.log("previewData", previewData);

    // Step 4: Return the preview data as JSON
    return c.json<any>(previewData);
  } catch (error) {
    // Log the error message
    console.error("Error fetching preview:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
}

// Function to create a new spreadsheet
export async function create(c: Context) {
  const headers = c.req.header();
  const body = await c.req.json(); // Get the request body

  try {
    const data = await fetchFromSheetsAPI("", headers, {}, "POST", body);
    return c.json<any>(data);
  } catch (error) {
    console.error("Error creating spreadsheet:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
}

// Sets values in one or more ranges of a spreadsheet.
export async function batchUpdateSheets(c: Context) {
  const spreadsheetId = c.req.param("spreadsheetId"); // Extract spreadsheetId from URL
  const headers = c.req.header();
  const body = await c.req.json(); // Get the request body

  try {
    const data = await fetchFromSheetsAPI(
      `/${spreadsheetId}:batchUpdate`,
      headers,
      {},
      "POST",
      body
    );
    return c.json<any>(data);
  } catch (error) {
    console.error("Error updating spreadsheet:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
}

// Function to copy a sheet to another spreadsheet
export async function copyTo(c: Context) {
  const spreadsheetId = c.req.param("spreadsheetId"); // Extract spreadsheetId from URL
  const sheetId = c.req.param("sheetId"); // Extract sheetId from URL
  const headers = c.req.header();
  const body = await c.req.json(); // Get the request body

  try {
    const data = await fetchFromSheetsAPI(
      `/${spreadsheetId}/sheets/${sheetId}:copyTo`,
      headers,
      {},
      "POST",
      body
    );
    return c.json<any>(data);
  } catch (error) {
    console.error("Error copying sheet:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
}

// Function to append values to a spreadsheet
export async function append(c: Context) {
  const spreadsheetId = c.req.param("spreadsheetId"); // Extract spreadsheetId from URL
  const range = c.req.param("range"); // Extract range from URL
  const headers = c.req.header();
  const queries = c.req.queries();
  const body = await c.req.json(); // Get the request body

  if(!queries.valueInputOption) {
    queries.valueInputOption = ["RAW"];
  }
  try {
    const data = await fetchFromSheetsAPI(
      `/${spreadsheetId}/values/${range}:append`,
      headers,
      queries,
      "POST",
      body
    );
    return c.json<any>(data);
  } catch (error) {
    console.error("Error appending values:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
}

// Function to clear values from a spreadsheet
export async function batchClear(c: Context) {
  const spreadsheetId = c.req.param("spreadsheetId"); // Extract spreadsheetId from URL
  const headers = c.req.header();
  const body = await c.req.json(); // Get the request body

  try {
    const data = await fetchFromSheetsAPI(
      `/${spreadsheetId}/values:batchClear`,
      headers,
      {},
      "POST",
      body
    );
    return c.json<any>(data);
  } catch (error) {
    console.error("Error clearing values:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
}

export async function batchGet(c: Context) {
  const spreadsheetId = c.req.param("spreadsheetId"); // Extract spreadsheetId from URL
  const headers = c.req.header();
  const queries = c.req.queries()

  try {
    const data = await fetchFromSheetsAPI(
      `/${spreadsheetId}/values:batchGet`,
      headers,
      queries
    );
    return c.json<any>(data);
  } catch (error) {
    console.error("Error fetching batch values:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
}

// Function to batch update values in a spreadsheet
export async function batchUpdateValues(c: Context) {
  const spreadsheetId = c.req.param("spreadsheetId"); // Extract spreadsheetId from URL
  const headers = c.req.header();
  const body = await c.req.json(); // Get the request body

  try {
    const data = await fetchFromSheetsAPI(
      `/${spreadsheetId}/values:batchUpdate`,
      headers,
      {},
      "POST",
      body
    );
    return c.json<any>(data);
  } catch (error) {
    console.error("Error batch updating values:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
}

// Function to clear values from a specified range in a spreadsheet
export async function clear(c: Context) {
  const spreadsheetId = c.req.param("spreadsheetId"); // Extract spreadsheetId from URL
  const range = c.req.param("range"); // Extract range from URL
  const headers = c.req.header();

  try {
    const data = await fetchFromSheetsAPI(
      `/${spreadsheetId}/values/${range}:clear`,
      headers,
      {},
      "POST"
    );
    return c.json<any>(data);
  } catch (error) {
    console.error("Error clearing values:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
}

// Function to clone a spreadsheet by creating a new spreadsheet and copying all sheets to it
export async function cloneSpreadsheet(c: Context) {
  const spreadsheetId = c.req.param("spreadsheetId"); // Extract spreadsheetId from URL
  const headers = c.req.header();

  try {
    // Step 1: Create a new spreadsheet
    const newSpreadsheetBody = {
      properties: {
        title: "Cloned Spreadsheet", // You can customize the title
      },
    };

    // Create the new spreadsheet
    const newSpreadsheet = await fetchFromSheetsAPI(
      "",
      headers,
      {},
      "POST",
      newSpreadsheetBody
    );

    const newSpreadsheetId = (newSpreadsheet as { spreadsheetId: string }).spreadsheetId;

    // Step 2: Fetch sheet metadata from the original spreadsheet
    const metadata = await fetchFromSheetsAPI(
      `/${spreadsheetId}`,
      headers,
      { fields: "sheets.properties" }
    ) as { sheets: { properties: { sheetId: number } }[] };

    // Step 3: Copy each sheet from the original spreadsheet to the new spreadsheet
    const copySheetPromises = metadata.sheets.map(async (sheet: any) => {
      const copyRequestBody = {
        destinationSpreadsheetId: newSpreadsheetId,
      };

      await fetchFromSheetsAPI(
        `/${spreadsheetId}/sheets/${sheet.properties.sheetId}:copyTo`,
        headers,
        {},
        "POST",
        copyRequestBody
      );
    });

    // Wait for all sheet copies to complete
    await Promise.all(copySheetPromises);

    // Step 4: Return the new spreadsheet's ID
    return c.json<any>({
      message: "Spreadsheet cloned successfully.",
      newSpreadsheetId: newSpreadsheetId,
    });
  } catch (error) {
    console.error("Error cloning spreadsheet:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
}


// Function to clone a sheet within the same spreadsheet and add 'Copy' to the sheet name
export async function cloneSheet(c: Context) {
  const spreadsheetId = c.req.param("spreadsheetId"); // Extract spreadsheetId from URL
  const sheetId = c.req.param("sheetId"); // Extract sheetId from URL
  const headers = c.req.header();
  const body = {
    destinationSheetId: sheetId,
  }

  try {
    const data = await fetchFromSheetsAPI(
      `/${spreadsheetId}/sheets/${sheetId}:copyTo`,
      headers,
      {},
      "POST",
      body
    );
    return c.json<any>(data);
  } catch (error) {
    console.error("Error copying sheet:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
}
