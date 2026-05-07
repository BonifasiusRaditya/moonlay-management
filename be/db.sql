create table clients (
  id serial primary key,
  name varchar(255) not null,
  code varchar(50) not null unique,
  address text,
  phone varchar(50),
  email varchar(100),
  country varchar(100),
  created_at timestamptz not null default now(),
  created_by integer,
  updated_at timestamptz not null default now(),
  updated_by integer,
  deleted_at timestamptz
);

create table branches (
  id serial primary key,
  client_id integer not null references clients(id) on delete cascade,
  name varchar(255) not null,
  code varchar(50) not null,
  address text,
  city varchar(100),
  country varchar(100),
  timezone varchar(100),
  created_at timestamptz not null default now(),
  created_by integer,
  updated_at timestamptz not null default now(),
  updated_by integer,
  deleted_at timestamptz
);

create table users (
  id serial primary key,
  client_id integer not null references clients(id) on delete cascade,
  branch_id integer references branches(id) on delete set null,
  name varchar(255) not null,
  email varchar(100) not null unique,
  password_hash varchar(255) not null,
  role varchar(150) not null,
  last_login_at timestamptz,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  created_by integer,
  updated_at timestamptz not null default now(),
  updated_by integer,
  deleted_at timestamptz
);

create table password_reset_tokens (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  token varchar(255) not null unique,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index clients_deleted_at_idx on clients(deleted_at);
create index branches_client_id_idx on branches(client_id);
create index branches_deleted_at_idx on branches(deleted_at);
create index users_client_id_idx on users(client_id);
create index users_branch_id_idx on users(branch_id);
create index users_email_idx on users(email);
create index users_deleted_at_idx on users(deleted_at);
create index password_reset_tokens_user_id_idx on password_reset_tokens(user_id);
create index password_reset_tokens_token_idx on password_reset_tokens(token);
create index password_reset_tokens_expires_at_idx on password_reset_tokens(expires_at);

insert into clients (name, code) values ('Default Client', 'DEFAULT');
insert into users (client_id, name, email, password_hash, role) values (1, 'Admin User', 'superadmin@example.com', '$2a$10$8.QsSdq/851YbC2zOPGOau7M6MgXiSIqMeZms0kFSAwcERkx7qOkW', 'superadmin');