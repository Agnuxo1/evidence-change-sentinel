CREATE LIGHTNING DATABASE sentinel_evidence DESCRIBE BY "Explicitly synthetic hackathon evidence";

CREATE LIGHTNING FILESTORE TABLE calls FROM sentinel_evidence FORMAT CSV OPTIONS (path "/home/zetaris/customer-data/shared/sentinel/calls.csv", header "true", delimiter ",");

CREATE LIGHTNING FILESTORE TABLE notices FROM sentinel_evidence FORMAT CSV OPTIONS (path "/home/zetaris/customer-data/shared/sentinel/notices.csv", header "true", delimiter ",");

CREATE SCHEMASTORE CONTAINER sentinel_review;

CREATE SCHEMASTORE VIEW sentinel_passages WITH CONTAINER sentinel_review AS SELECT source_id, version, passage_id, passage_text, source_url FROM sentinel_evidence.calls UNION ALL SELECT source_id, version, passage_id, passage_text, source_url FROM sentinel_evidence.notices
