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
            version: "captain-file-storage-v2",
            storage: "ready",
            persistent: storage.mode === "persistent",
            dataDir: storage.dataDir,
            fallbackReason: storage.fallbackReason,
            initialized: storage.initialized,
            session: "ready",
          });
        } catch (error) {
          console.error(error);
          return Response.json({
            ok: false,
            version: "captain-file-storage-v2",
            storage: "unavailable",
            persistent: false,
          });
        }
      },
    },
  },
});