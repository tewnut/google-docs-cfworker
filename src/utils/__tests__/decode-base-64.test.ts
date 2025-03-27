import { decodeBase64 } from "../decode-base-64";

describe("decodeBase64", () => {
    // Polyfill atob for Node.js if not defined (Jest runs in Node environment)
    beforeAll(() => {
        if (typeof atob === "undefined") {
            // @ts-ignore
            global.atob = (str: string) => Buffer.from(str, "base64").toString("binary");
        }
    });

    it("should decode a simple base64 encoded string", () => {
        const original = "Hello, World!";
        const encoded = Buffer.from(original).toString("base64");
        const decoded = decodeBase64(encoded);
        expect(decoded).toBe(original);
    });

    it("should decode a markdown string with special characters", () => {
        const markdown = "# Title\nThis is a **bold** test with emojis 😄 and accents éàè.";
        const encoded = Buffer.from(markdown).toString("base64");
        const decoded = decodeBase64(encoded);
        expect(decoded).toBe(markdown);
    });

    it("should return an empty string when given an empty string", () => {
        const decoded = decodeBase64("");
        expect(decoded).toBe("");
    });
});
