CREATE TABLE responses (
 id TEXT PRIMARY KEY,
 version TEXT NOT NULL,
 marker_hash TEXT NOT NULL,
 channel TEXT NOT NULL CHECK(channel IN ('web','verbal')),
 created_at TEXT NOT NULL,
 current_locations TEXT NOT NULL CHECK(json_valid(current_locations)),
 placement TEXT NOT NULL,
 concerns TEXT NOT NULL CHECK(json_valid(concerns)),
 priorities TEXT NOT NULL CHECK(json_valid(priorities)),
 usefulness TEXT NOT NULL,
 improvement TEXT NOT NULL,
 current_other TEXT NOT NULL,
 placement_other TEXT NOT NULL,
 concerns_other TEXT NOT NULL,
 UNIQUE(version, marker_hash)
);
CREATE TABLE contacts (
 response_id TEXT PRIMARY KEY REFERENCES responses(id) ON DELETE CASCADE,
 name TEXT NOT NULL,
 email TEXT NOT NULL,
 consent INTEGER NOT NULL CHECK(consent=1),
 consent_at TEXT NOT NULL
);
