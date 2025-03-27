// Decode a base64 string to a utf-8 string
export function decodeBase64(str: string): string {
    return decodeURIComponent(
      Array.prototype.map.call(atob(str), (c: string) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
  }
  