import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { readState, storageMode } = await import("@/lib/captain-db.server");
          await readState();
          const mode = storageMode();
          return Response.json({
            ok: true,
            database: mode === "postgres" ? "connected" : "temporary",
            persistent: mode === "postgres",
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