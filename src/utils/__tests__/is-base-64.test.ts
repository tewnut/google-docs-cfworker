import { isBase64 } from "../is-base-64";

describe("isBase64", () => {
  it("should return true for a valid base64 string without whitespace", () => {
    // "Hello, World!" in base64: "SGVsbG8sIFdvcmxkIQ=="
    const validBase64 = "SGVsbG8sIFdvcmxkIQ==";
    expect(isBase64(validBase64)).toBe(true);
  });

  it("should return true for a valid base64 string with line breaks and uniform line lengths", () => {
    // Simulate a MIME-style base64 string with line breaks.
    // Using 64-character lines is common.
    const line = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const validBase64WithBreaks = `${line}\n${line}\n${line.slice(0, 62)}==`;
    expect(isBase64(validBase64WithBreaks)).toBe(true);
  });

  it("should return false if there are line breaks with non-uniform line lengths", () => {
    // Alter one line length to simulate non-base64 formatted text.
    const invalidBase64Lines = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/\n" +
                                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+\n" + // one char shorter
                                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    expect(isBase64(invalidBase64Lines)).toBe(false);
  });

  it("should return false if the line length is too short (heuristic check)", () => {
    // Even if overall structure is base64, if the lines are very short, it's likely not a MIME formatted base64.
    const shortLine = "ABCDEF"; // only 6 characters per line
    const base64ShortLines = `${shortLine}\n${shortLine}\n${shortLine}`;
    expect(isBase64(base64ShortLines)).toBe(false);
  });

  it("should return false for a normal text string with varied spacing", () => {
    const normalText = "This is a normal text with\nline breaks and varied\nlength lines.";
    expect(isBase64(normalText)).toBe(false);
  });

  it("should return false for an empty string", () => {
    expect(isBase64("")).toBe(false);
  });
});
