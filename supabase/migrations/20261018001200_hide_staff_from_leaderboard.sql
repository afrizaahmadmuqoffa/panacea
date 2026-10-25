-- Staff (reviewer/admin) tidak boleh tampil di leaderboard: mereka tidak bermain game.
-- Satu kali; setelah itu updateProfileAction menjaga show_on_leaderboard=false untuk non-user.
update public.profiles p
set show_on_leaderboard = false
where exists (
  select 1 from private.user_roles r
  where r.user_id = p.id and r.role in ('reviewer', 'admin')
);
