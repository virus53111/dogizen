ALTER TABLE mm_traffic_minute
  DROP CONSTRAINT mm_traffic_minute_source_check,
  ADD CONSTRAINT mm_traffic_minute_source_check
    CHECK (source IN ('direct', 'facebook', 'tiktok', 'youtube', 'instagram', 'telegram', 'google', 'bing', 'other', 'date_game'));
