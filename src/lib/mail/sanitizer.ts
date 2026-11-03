/**
 * MailMe Safe HTML Sanitizer
 * Strips XSS attack vectors, trackers, and prepares safe HTML for sandboxed iframes.
 */

export function sanitizeEmailHtml(rawHtml: string): {
  sanitizedHtml: string;
  hasRemoteImages: boolean;
  blockedImagesCount: number;
} {
  if (!rawHtml) {
    return { sanitizedHtml: "", hasRemoteImages: false, blockedImagesCount: 0 };
  }

  let html = rawHtml;
  let hasRemoteImages = false;
  let blockedImagesCount = 0;

  // 1. Remove dangerous executable tags
  const dangerousTags = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
  ];

  for (const regex of dangerousTags) {
    html = html.replace(regex, "");
  }

  // 2. Remove inline event handlers (onload, onerror, onclick, etc.)
  html = html.replace(/\s+on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "");

  // 3. Remove javascript: and vbscript: URIs in href / src
  html = html.replace(/(href|src)\s*=\s*['"]\s*(javascript|vbscript|data):[^'"]*['"]/gi, '$1="#"');

  // 4. Neutralize remote tracking pixels and images (protect IP & tracking)
  html = html.replace(/<img\s+([^>]*?)src=["'](https?:\/\/[^"']+)["']([^>]*?)>/gi, (match, before, url, after) => {
    hasRemoteImages = true;
    blockedImagesCount++;
    // Replace src with a placeholder or data-blocked-src
    return `<img ${before} data-blocked-src="${url}" src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23666'><rect width='100%' height='100%' fill='%23eee'/></svg>" title="Imagen remota bloqueada para proteger privacidad" ${after}>`;
  });

  return {
    sanitizedHtml: html,
    hasRemoteImages,
    blockedImagesCount,
  };
}
