-- The private schema is reachable only by the service role. Anon and authenticated
-- hold no grants on it, and every table has RLS enabled.
alter role authenticator set pgrst.db_schemas = 'public, graphql_public, private';
notify pgrst, 'reload config';
