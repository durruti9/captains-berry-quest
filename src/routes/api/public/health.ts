import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { readState } = await import("@/lib/captain-db.server");
          await readState();
          return Response.json({ ok: true, database: "connected" });
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