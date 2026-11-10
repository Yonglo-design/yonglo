import { wixApiRequest } from "./wix-client.js";

/**
 * Wix CMS (Wix Data) — REST helpers (subset used by this site: read-only queries).
 * Collections are read as an ANONYMOUS VISITOR; the collection must grant Read to "Anyone".
 * Reference: https://dev.wix.com/docs/api-reference/business-solutions/cms/data-items/query-data-items.md
 */

/**
 * Guard: reject `undefined` values inside a filter.
 * `JSON.stringify` DELETES undefined values, so a missing variable would silently change what the
 * query matches. Fail loudly instead.
 */
function assertDefinedFilterValues(filter, path = "filter") {
  if (!filter || typeof filter !== "object") return;
  for (const [key, value] of Object.entries(filter)) {
    const at = Array.isArray(filter) ? `${path}[${key}]` : `${path}.${key}`;
    if (value === undefined) {
      throw new Error(
        `wix-cms: ${at} is undefined. JSON.stringify drops undefined, so this query would ` +
          `silently match every item (or none) instead of filtering. Pass a real value, or omit ` +
          `the key entirely.`,
      );
    }
    if (value && typeof value === "object" && !(value instanceof Date)) {
      assertDefinedFilterValues(value, at);
    }
  }
}

/**
 * Query one page of items from a collection.
 * Pass `nextCursor` back as `cursor` to load the next page. Define `filter`/`sort`/`fields`
 * on the FIRST request only — on cursor follow-ups Wix reuses the original query.
 * @returns {Promise<{ items: object[], nextCursor: string|null }>}
 */
export async function queryDataItems(dataCollectionId, { filter, sort, limit = 100, cursor, fields, includeReferences } = {}) {
  assertDefinedFilterValues(filter);
  const query = {
    ...(cursor
      ? {}
      : {
          ...(filter ? { filter } : {}),
          ...(sort ? { sort } : {}),
          ...(fields ? { fields } : {}),
        }),
    cursorPaging: cursor ? { limit, cursor } : { limit },
  };
  const res = await wixApiRequest("/wix-data/v2/items/query", {
    method: "POST",
    body: {
      dataCollectionId,
      query,
      ...(includeReferences ? { includeReferences } : {}),
    },
  });
  return {
    items: (res?.dataItems ?? []).map((d) => d.data),
    nextCursor: res?.pagingMetadata?.cursors?.next ?? null,
  };
}
