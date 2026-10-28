import { headers } from "next/headers";

/**
 * Реальный внешний адрес сайта (для QR-кода и ссылок «поделиться»).
 * В контейнере сервер слушает 0.0.0.0, поэтому берём host из заголовков.
 */
export async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") || h.get("host") || "").split(",")[0].trim();
  if (!host) return "http://localhost:3000";

  const forwardedProto = (h.get("x-forwarded-proto") || "").split(",")[0].trim();
  const isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?)(:\d+)?$/.test(host);
  const proto = forwardedProto || (isLocal ? "http" : "https");
  return `${proto}://${host}`;
}
