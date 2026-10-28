/**
 * Приводит то, что прислал пользователь (код, ссылку или содержимое QR), к
 * единому формату кода пары: SAKURA-7F3K2Q.
 * Работает и в браузере, и на сервере.
 */
export function normalizeJoinCode(raw: string): string {
  let value = (raw ?? "").trim();

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const q = url.searchParams.get("code") || url.searchParams.get("c") || "";
      value = q || url.pathname.split("/").filter(Boolean).pop() || "";
    } catch {
      /* не ссылка — оставим как есть */
    }
  }

  return value
    .replace(/[\u041e\u043e]/g, "O") // кириллическая О -> латинская O
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 24);
}

/** Из содержимого QR (обычно это ссылка) достаём только код. */
export function codeFromQr(payload: string): string {
  return normalizeJoinCode(payload);
}
