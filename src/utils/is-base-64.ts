/**
 * Checks whether the provided string looks like it is base64 encoded.
 * It removes whitespace, checks that the length is a multiple of 4,
 * that the string contains only valid base64 characters, and if there
 * are line breaks, verifies that non-empty lines (except possibly the last)
 * all have equal, sufficiently long lengths.
 */
export function isBase64(str: string): boolean {
    // Remove all whitespace for basic structure check.
    const s = str.replace(/\s/g, '');
    if (s.length === 0) return false;
    if (s.length % 4 !== 0) return false;
    const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
    if (!base64Regex.test(s)) return false;
  
    // Additional heuristic: if there are line breaks, then the lines should be uniform in length.
    const lines = str.split(/\r?\n/).filter(line => line.length > 0);
    if (lines.length > 1) {
      // For base64 strings with inserted line breaks (like MIME), each line (except possibly the last)
      // is typically of equal length, and that length is usually relatively long (e.g., 64 or 76).
      const firstLineLength = lines[0].length;
      // Use a threshold (e.g., 16 characters) to avoid false positives with normal text.
      if (firstLineLength < 16) return false;
      for (let i = 0; i < lines.length - 1; i++) {
        if (lines[i].length !== firstLineLength) return false;
      }
    }
    return true;
  }
  