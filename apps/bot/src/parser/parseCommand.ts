export interface ParsedCommand {
  link?: string;
  title?: string;
  comment?: string;
}

// Matches http(s) URLs. Deliberately permissive on the path.
const URL_REGEX = /\bhttps?:\/\/[^\s]+/i;

/**
 * Parse a `!`-prefixed command body. The leading `!` is already stripped.
 *
 * Two shapes (per spec):
 *   ![link] - [optional comment]
 *   ![title] - [optional comment]
 *
 * We split on the FIRST ` - ` (space-dash-space). If the head, after trimming,
 * is a single URL, we call it a link command. Otherwise, title command.
 *
 * Returns `{}` for empty/invalid input — callers should treat as "ignore".
 */
export function parseCommand(raw: string): ParsedCommand {
  const text = raw.trim();
  if (!text) return {};

  const idx = text.indexOf(' - ');
  const head = (idx === -1 ? text : text.slice(0, idx)).trim();
  const comment = idx === -1 ? undefined : text.slice(idx + 3).trim() || undefined;

  if (!head) return {};

  // URL check: the head is a link iff it's *just* a URL.
  const urlMatch = head.match(URL_REGEX);
  if (urlMatch && urlMatch[0] === head) {
    return { link: head, comment };
  }

  return { title: head, comment };
}
