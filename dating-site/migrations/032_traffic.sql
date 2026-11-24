CREATE TABLE IF NOT EXISTS mm_traffic_minute (
 bucket TIMESTAMPTZ NOT NULL,
 country CHAR(2) NOT NULL CHECK(country ~ '^[A-Z]{2}$'),
 source TEXT NOT NULL CHECK(source IN ('direct','facebook','tiktok','youtube','instagram','telegram','google','bing','other')),
 pageviews BIGINT NOT NULL DEFAULT 0 CHECK(pageviews>=0),
 visits BIGINT NOT NULL DEFAULT 0 CHECK(visits>=0 AND visits<=pageviews),
 PRIMARY KEY(bucket,country,source)
);
