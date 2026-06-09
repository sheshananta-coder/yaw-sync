# yaw-sync

Sync-Server für die Schwierigkeits-Bewertungen der Yoga@Work-App.
Persistente Speicherung via Deno KV, läuft auf Deno Deploy.

## API

- `GET  /ratings` → `{ "DSC1234.jpg": 3, ... }`
- `POST /ratings` `{name, stars}` → setzt (stars > 0) oder löscht (stars ≤ 0)
- `GET  /health` → `ok`

## Lokal testen

```
deno run --unstable-kv --allow-net main.ts
```

## Deploy

Verbunden mit Deno Deploy — jeder Push auf `main` deployt automatisch.
Entry-Point: `main.ts`
