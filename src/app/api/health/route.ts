import type { PoolClient } from "pg";
import { pool } from "@/db";

// The platform's health check (`.railway/railway.ts` -> healthcheck) calls this.
// It asks Postgres as well, so a bad or unreachable DATABASE_URL fails the
// deploy rather than going live and then 500ing on every request.
export const dynamic = "force-dynamic";

const DEADLINE_MS = 5_000;

// statement_timeout bounds server-side execution, but the client can still
// wait forever for response packets. Bound each await independently.
function withDeadline<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("health probe timed out")), DEADLINE_MS);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export async function GET() {
  let client: PoolClient | undefined;
  let destroyClient = true;
  try {
    client = await pool.connect();
    // connectionTimeoutMillis covers connection setup. SET LOCAL confines the
    // timeout to this probe, so releasing a healthy session cannot poison later
    // queries that legitimately run longer than DEADLINE_MS.
    await withDeadline(client.query("BEGIN"));
    await withDeadline(client.query("SET LOCAL statement_timeout = 5000"));
    await withDeadline(client.query("select 1"));
    await withDeadline(client.query("COMMIT"));
    destroyClient = false;
    return Response.json({ ok: true });
  } catch (err) {
    // Log the cause but keep the response minimal: the platform only needs to
    // know whether the database answered.
    console.error("Health check failed: the database didn't answer", err);
    return Response.json({ ok: false }, { status: 503 });
  } finally {
    // A timed-out query may still be in flight on the server. Discard failed
    // probes, but return healthy sessions to the pool.
    client?.release(destroyClient);
  }
}
