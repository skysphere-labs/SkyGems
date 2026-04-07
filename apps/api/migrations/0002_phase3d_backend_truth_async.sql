ALTER TABLE generations
ADD COLUMN execution_mode TEXT NOT NULL
DEFAULT 'local'
CHECK(execution_mode IN ('queue', 'local'));

ALTER TABLE generations
ADD COLUMN execution_source TEXT NOT NULL
DEFAULT 'local_development'
CHECK(execution_source IN (
  'configured_queue',
  'configured_local',
  'default_auto',
  'local_development',
  'queue_send_failed_fallback'
));
