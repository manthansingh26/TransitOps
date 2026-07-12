import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/seed-demo-users")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const demo = [
          { email: "manager@transitops.demo", role: "fleet_manager", full_name: "Morgan Manager" },
          { email: "driver@transitops.demo", role: "driver", full_name: "Dylan Driver" },
          { email: "safety@transitops.demo", role: "safety_officer", full_name: "Sam Safety" },
          { email: "finance@transitops.demo", role: "financial_analyst", full_name: "Fiona Finance" },
        ] as const;

        const results: Record<string, string> = {};
        for (const u of demo) {
          const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
            email: u.email,
            password: "Demo1234!",
            email_confirm: true,
            user_metadata: { full_name: u.full_name, role: u.role },
          });
          let userId = created?.user?.id;
          if (error) {
            if (!/already/i.test(error.message)) {
              results[u.email] = `error: ${error.message}`;
              continue;
            }
            // Find existing user id
            const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
            userId = list?.users.find((x) => x.email === u.email)?.id;
            // Ensure password matches
            if (userId) await supabaseAdmin.auth.admin.updateUserById(userId, { password: "Demo1234!" });
          }
          if (!userId) { results[u.email] = "no id"; continue; }
          // Ensure profile + correct role
          await supabaseAdmin.from("profiles").upsert({ id: userId, full_name: u.full_name });
          await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
          await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: u.role });
          results[u.email] = "ok";
        }
        return Response.json({ ok: true, results });
      },
    },
  },
});
