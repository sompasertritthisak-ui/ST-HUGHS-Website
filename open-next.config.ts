import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";

/**
 * OpenNext → Cloudflare Workers.
 * - Incremental (ISR) cache in R2 (`NEXT_INC_CACHE_R2_BUCKET`).
 * - Time-based revalidation queue and on-demand `revalidatePath` tag cache in
 *   Durable Objects, so publishing in the CMS refreshes public pages immediately.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
  tagCache: doShardedTagCache({ baseShardSize: 12 }),
});
