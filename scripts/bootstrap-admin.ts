import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!url || !secretKey || !email || !password) {
    throw new Error("Supabase URL, secret key, bootstrap email, and password are required.");
  }

  const admin = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: "Administrator",
      alias: "Admin",
    },
  });

  let userId = created.data.user?.id;
  if (created.error || !userId) {
    const users = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = users.data.users.find((user) => user.email === email);
    if (!existing) throw new Error(created.error?.message ?? "Admin user could not be created.");
    userId = existing.id;
    const updated = await admin.auth.admin.updateUserById(userId, { password });
    if (updated.error) throw new Error(updated.error.message);
  }

  const profile = await admin.from("profiles").upsert(
    {
      id: userId,
      full_name: "Administrator",
      alias: "Admin",
      show_on_leaderboard: false,
    },
    { onConflict: "id" },
  );
  if (profile.error) throw new Error(profile.error.message);

  const role = await admin
    .schema("private")
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id" });
  if (role.error) throw new Error(role.error.message);

  console.log(`Admin ready: ${email}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
