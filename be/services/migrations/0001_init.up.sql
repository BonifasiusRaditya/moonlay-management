CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'staff', 'viewer');
CREATE TYPE employee_status AS ENUM ('active', 'inactive');

CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(100),
  country VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by INTEGER,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE branches (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  timezone VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by INTEGER,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(150) NOT NULL,
  last_login_at TIMESTAMPTZ,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by INTEGER,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  table_name VARCHAR(255) NOT NULL,
  record_id INTEGER NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(100) NOT NULL,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  status employee_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by INTEGER,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_prefix VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  key VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_by INTEGER,
  updated_by INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  key VARCHAR(150) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INTEGER,
  updated_by INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (client_id, key)
);

CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_by INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role_id, permission_id)
);

CREATE INDEX clients_deleted_at_idx ON clients(deleted_at);
CREATE INDEX branches_client_id_idx ON branches(client_id);
CREATE INDEX branches_deleted_at_idx ON branches(deleted_at);
CREATE INDEX users_client_id_idx ON users(client_id);
CREATE INDEX users_branch_id_idx ON users(branch_id);
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_deleted_at_idx ON users(deleted_at);
CREATE INDEX audit_logs_client_id_idx ON audit_logs(client_id);
CREATE INDEX audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX audit_logs_table_name_idx ON audit_logs(table_name);
CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at);
CREATE INDEX password_reset_tokens_user_id_idx ON password_reset_tokens(user_id);
CREATE INDEX password_reset_tokens_token_idx ON password_reset_tokens(token);
CREATE INDEX password_reset_tokens_expires_at_idx ON password_reset_tokens(expires_at);
CREATE INDEX employees_client_id_idx ON employees(client_id);
CREATE INDEX employees_branch_id_idx ON employees(branch_id);
CREATE INDEX employees_email_idx ON employees(email);
CREATE INDEX employees_status_idx ON employees(status);
CREATE INDEX employees_deleted_at_idx ON employees(deleted_at);
CREATE INDEX api_keys_client_id_idx ON api_keys(client_id);
CREATE INDEX api_keys_key_hash_idx ON api_keys(key_hash);
CREATE INDEX api_keys_is_active_idx ON api_keys(is_active);
CREATE INDEX api_keys_expires_at_idx ON api_keys(expires_at);

INSERT INTO clients (name, code) VALUES ('Default Client', 'DEFAULT');
