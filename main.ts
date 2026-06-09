// Sync-Server fuer die Yoga@Work-Bewertungen — Variante fuer Deno Deploy.
// Gleiche API wie tool/sync_server.dart, aber persistent via Deno KV
// (uebersteht Neustarts/Deploys) und gratis auf https://deno.com/deploy.
//
// Lokal testen:  deno run --unstable-kv --allow-net deno/main.ts
// Deploy:        Repo bei dash.deno.com verbinden, Entry-Point: deno/main.ts
//
// API:
//   GET  /ratings              -> { "DSC1234.jpg": 3, ... }
//   POST /ratings {name,stars} -> setzt (stars>0) oder loescht (stars<=0)
//   GET  /health               -> "ok"

const kv = await Deno.openKv();

const CORS: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function loadAll(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for await (const entry of kv.list<number>({ prefix: ["ratings"] })) {
    const name = entry.key[1] as string;
    out[name] = entry.value;
  }
  return out;
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (url.pathname === "/health" && req.method === "GET") {
    return new Response("ok", { headers: CORS });
  }

  if (url.pathname === "/ratings" && req.method === "GET") {
    return json(await loadAll());
  }

  if (url.pathname === "/ratings" && req.method === "POST") {
    try {
      const body = await req.json();
      const name = String(body.name);
      const stars = Number(body.stars);
      if (!name) return json({ error: "name fehlt" }, 400);
      if (stars <= 0) {
        await kv.delete(["ratings", name]);
      } else {
        await kv.set(["ratings", name], Math.trunc(stars));
      }
      return json(await loadAll());
    } catch (e) {
      return json({ error: String(e) }, 400);
    }
  }

  return new Response("not found", { status: 404, headers: CORS });
});
