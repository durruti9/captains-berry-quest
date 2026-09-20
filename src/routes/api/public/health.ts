import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { readState, storageMode } = await import("@/lib/captain-db.server");
          await readState();
          const mode = storageMode();
          const sessionSecret = process.env["SESSION_SECRET"];
          const sessionReady = Boolean(sessionSecret && sessionSecret.length >= 32);
          if (process.env["REQUIRE_DATABASE"] === "1" && !sessionReady) {
            return Response.json(
              { ok: false, database: "connected", persistent: true, session: "misconfigured" },
              { status: 503 },
            );
          }
          return Response.json({
            ok: true,
            database: mode === "postgres" ? "connected" : "temporary",
            persistent: mode === "postgres",
            session: sessionReady ? "ready" : "development-default",
          });
        } catch (error) {
          console.error(error);
          return Response.json(
            { ok: false, database: "unavailable" },
            { status: 503 },
          );
        }
      },
    },
  },
});