CREATE TABLE IF NOT EXISTS places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  latitude REAL,
  longitude REAL,
  city TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  has_website INTEGER DEFAULT 0,
  phone_verified INTEGER DEFAULT 0,
  whatsapp_verified INTEGER DEFAULT 0,
  search_keyword TEXT,
  scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_places_city ON places(city);
CREATE INDEX IF NOT EXISTS idx_places_has_website ON places(has_website);
