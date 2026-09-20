import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { checkStorage, getSessionSecret } = await import("@/lib/captain-db.server");
          const storage = await checkStorage();
          await getSessionSecret();
          return Response.json({
            ok: true,
            storage: "ready",
            persistent: storage.mode === "persistent",
            initialized: storage.initialized,
            session: "ready",
          });
        } catch (error) {
          console.error(error);
          return Response.json(
            { ok: false, storage: "unavailable", persistent: false },
            { status: 503 },
          );
        }
      },
    },
  },
});