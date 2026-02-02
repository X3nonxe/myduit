create extension if not exists pg_cron;

select cron.schedule(
  'cleanup-audit-logs',
  '0 3 * * *',
  $$
    delete from "AuditLog" where "createdAt" < now() - interval '30 days';
  $$
);

