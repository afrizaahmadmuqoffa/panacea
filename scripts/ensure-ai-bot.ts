import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const BOT_EMAIL = "ai@panacea.local";
const BOT_NAME = "PANACEA AI";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("Supabase URL and secret key are required.");
  }

  const admin = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const created = await admin.auth.admin.createUser({
    email: BOT_EMAIL,
    password: randomUUID(),
    email_confirm: true,
    user_metadata: { full_name: BOT_NAME, alias: BOT_NAME },
  });

  let userId = created.data.user?.id;
  if (created.error || !userId) {
    const users = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = users.data.users.find((user) => user.email === BOT_EMAIL);
    if (!existing) throw new Error(created.error?.message ?? "AI bot user could not be created.");
    userId = existing.id;
  }

  const profile = await admin.from("profiles").upsert(
    {
      id: userId,
      full_name: BOT_NAME,
      alias: BOT_NAME,
      show_on_leaderboard: false,
      is_bot: true,
    },
    { onConflict: "id" },
  );
  if (profile.error) throw new Error(profile.error.message);

  const role = await admin
    .schema("private")
    .from("user_roles")
    .upsert({ user_id: userId, role: "user" }, { onConflict: "user_id" });
  if (role.error) throw new Error(role.error.message);

  console.log(`AI bot ready: ${BOT_EMAIL} (${userId})`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
