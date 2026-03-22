/**
 * Parse `filter` from query string: stringified JSON `{ field, op, value }`.
 * Supports:
 * - Raw JSON in the URL (no encodeURIComponent), when the client/stack keeps it intact
 * - URL-encoded JSON (encodeURIComponent or URLSearchParams), including double-encoded edge cases
 * - Plain object if a query parser already expanded `filter`
 */

function firstQueryValue(value) {
  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }
  return value;
}

function buildJsonCandidatesFromQueryString(s) {
  const trimmed = String(s).trim();
  if (!trimmed) {
    return [];
  }
  const candidates = [trimmed];
  try {
    let decoded = decodeURIComponent(trimmed);
    if (decoded !== trimmed) {
      candidates.push(decoded);
      try {
        const again = decodeURIComponent(decoded);
        if (again !== decoded) {
          candidates.push(again);
        }
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
  return candidates;
}

/**
 * @param {unknown} raw - req.query.filter
 * @returns {{ parsed: object | null, error: string | null }}
 */
function parseFilterFromQueryParam(raw) {
  const value = firstQueryValue(raw);

  if (value === undefined || value === null || value === "") {
    return { parsed: null, error: null };
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return { parsed: value, error: null };
  }

  if (typeof value !== "string") {
    return {
      parsed: null,
      error:
        "filter must be stringified JSON (JSON.stringify), with or without URL encoding.",
    };
  }

  const candidates = buildJsonCandidatesFromQueryString(value);
  for (const jsonStr of candidates) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (
        parsed !== null &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return { parsed, error: null };
      }
    } catch {
      /* try next candidate */
    }
  }

  return {
    parsed: null,
    error:
      "filter must be valid JSON with shape { field, op, value } (raw or URL-encoded).",
  };
}

module.exports = { parseFilterFromQueryParam };
