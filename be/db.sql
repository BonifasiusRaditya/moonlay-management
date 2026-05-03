create extension if not exists "pgcrypto"; 

create table users (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  email varchar(150) not null,
  role varchar(20),
  created_at timestamp
);

-- bank_accounts
create table bank_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_name varchar(50) not null,
  account_number varchar(30) not null,
  account_name varchar(100) not null,
  status varchar(20) default 'active',
  last_synced_at timestamp,
  created_at timestamp
);

-- documents
create table documents (
  id uuid primary key default gen_random_uuid(),
  file_name varchar(255) not null,
  file_type varchar(20) not null,
  file_url varchar(500) not null,
  parse_status varchar(20) not null,
  uploaded_by uuid references users(id) on delete set null,
  uploaded_at timestamp
);

-- chart_of_accounts
create table chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  code varchar(20) unique not null,
  name varchar(150),
  account_type varchar(20) not null,
  is_active boolean default true,
  created_at timestamp
);

-- transactions
create table transactions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete set null,
  transaction_date date not null,
  description text,
  amount decimal(18, 2) not null,
  direction varchar(10),
  raw_category varchar(100),
  pipeline_status varchar(20),
  created_at timestamp
);

-- ai_classifications
create table llm_classifications (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id) on delete cascade,
  suggested_coa_id uuid not null references chart_of_accounts(id) on delete restrict,
  confidence_score decimal(4, 2),
  reasoning text,
  is_anomaly boolean default false,
  classified_at timestamp
);

-- journal_entries
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id) on delete restrict,
  final_coa_id uuid not null references chart_of_accounts(id) on delete restrict,
  debit_amount decimal(18, 2),
  credit_amount decimal(18, 2),
  is_auto_journaled boolean default false,
  journaled_at timestamp
);

-- approvals
create table approvals (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id) on delete restrict,
  reviewed_by uuid references users(id) on delete set null,
  action varchar(20),
  override_coa_id uuid references chart_of_accounts(id) on delete set null,
  note text,
  reviewed_at timestamp
);

-- indexes for common queries
create index idx_transactions_status on transactions(pipeline_status);
create index idx_transactions_date on transactions(transaction_date);
create index idx_llm_classifications_transaction on llm_classifications(transaction_id);
create index idx_approvals_transaction on approvals(transaction_id);
create index idx_journal_entries_transaction on journal_entries(transaction_id);