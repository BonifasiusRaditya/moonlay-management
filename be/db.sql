CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  email varchar NOT NULL UNIQUE,
  password varchar NOT NULL,
  role varchar,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name varchar,
  file_extension varchar,
  file_type varchar,
  file_url varchar,
  uploaded_by integer REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

drop table if exists transactions_business cascade;
CREATE TABLE IF NOT EXISTS transactions_business (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  invoice_number varchar NOT NULL,
  transaction_date date NOT NULL,
  vendor varchar NOT NULL,
  amount numeric(18,2) NOT NULL,
  coa varchar NOT NULL,
  score_ai real,
  status varchar,
  parse varchar,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transaction_business_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_business_id uuid NOT NULL REFERENCES transactions_business(id) ON DELETE CASCADE,
  item_name varchar NOT NULL,
  item_description text,
  quantity numeric(18,2),
  unit_price numeric(18,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_ai_confidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions_business(id) ON DELETE CASCADE,
  confidence_score real,
  confidence_level varchar,
  coa_recommendation varchar,
  reasoning varchar,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- see all table exist
select table_name from information_schema.tables where table_schema = 'public';
CREATE INDEX documents_uploaded_by_idx ON documents(uploaded_by);
CREATE INDEX transactions_business_transaction_date_idx ON transactions_business(transaction_date);
CREATE INDEX transaction_business_items_transaction_business_id_idx ON transaction_business_items(transaction_business_id);
CREATE INDEX business_ai_confidence_transaction_id_idx ON business_ai_confidence(transaction_id); 

-- End of schema

-- Delete data from tables
DELETE FROM business_ai_confidence;
DELETE FROM transaction_business_items;
DELETE FROM transactions_business;
DELETE FROM documents;
DELETE FROM users;

-- See all data in tables
SELECT * FROM users;
SELECT * FROM documents;
SELECT * FROM transactions_business;
SELECT * FROM transaction_business_items;
SELECT * FROM business_ai_confidence;
