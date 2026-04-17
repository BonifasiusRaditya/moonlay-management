-- Baseline permissions aligned with Node migration + hidden flag support.
INSERT INTO permissions (key, description, is_hidden)
VALUES
  ('clients:read', 'clients:read', false),
  ('clients:create', 'clients:create', false),
  ('clients:update', 'clients:update', false),
  ('clients:delete', 'clients:delete', false),
  ('branches:read', 'branches:read', false),
  ('branches:create', 'branches:create', false),
  ('branches:update', 'branches:update', false),
  ('branches:delete', 'branches:delete', false),
  ('employees:read', 'employees:read', false),
  ('employees:create', 'employees:create', false),
  ('employees:update', 'employees:update', false),
  ('employees:delete', 'employees:delete', false),
  ('users:create', 'users:create', false),
  ('users:read', 'users:read', false),
  ('users:update', 'users:update', false),
  ('users:delete', 'users:delete', false),
  ('dashboard:read', 'dashboard:read', false),
  ('reports:read', 'reports:read', false),
  ('api_keys:create', 'api_keys:create', false),
  ('api_keys:read', 'api_keys:read', false),
  ('api_keys:update', 'api_keys:update', false),
  ('api_keys:delete', 'api_keys:delete', false),
  ('roles:manage', 'roles:manage', false),
  ('permissions:read', 'permissions:read', false),
  ('admin.clients:read', 'Read clients', true),
  ('admin.clients:create', 'Create clients', true),
  ('admin.clients:update', 'Update clients', true),
  ('admin.clients:delete', 'Delete clients', true),
  ('admin.audit_logs:read', 'Read audit logs', false),
  ('admin.reports:read', 'Read reports', false),
  ('admin.rbac:manage', 'Manage RBAC', false)
ON CONFLICT (key) DO UPDATE
SET description = EXCLUDED.description,
    is_hidden = EXCLUDED.is_hidden,
    updated_at = now(),
    deleted_at = NULL;

INSERT INTO roles (client_id, key, name, description)
VALUES (NULL, 'superadmin', 'Super Admin', 'Global superadmin')
ON CONFLICT (client_id, key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = now(),
    deleted_at = NULL;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.deleted_at IS NULL
WHERE r.client_id IS NULL
  AND r.key = 'superadmin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO roles (client_id, key, name, description)
SELECT c.id, 'admin', 'Admin', 'Default admin role'
FROM clients c
ON CONFLICT (client_id, key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = now(),
    deleted_at = NULL;

INSERT INTO roles (client_id, key, name, description)
SELECT c.id, 'staff', 'Staff', 'Default staff role'
FROM clients c
ON CONFLICT (client_id, key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = now(),
    deleted_at = NULL;

INSERT INTO roles (client_id, key, name, description)
SELECT c.id, 'viewer', 'Viewer', 'Default viewer role'
FROM clients c
ON CONFLICT (client_id, key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = now(),
    deleted_at = NULL;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.deleted_at IS NULL
WHERE r.key = 'admin'
  AND p.key IN (
    'branches:read', 'branches:create', 'branches:update', 'branches:delete',
    'employees:read', 'employees:create', 'employees:update', 'employees:delete',
    'users:create', 'users:read', 'users:update', 'users:delete',
    'dashboard:read', 'reports:read',
    'api_keys:create', 'api_keys:read', 'api_keys:update', 'api_keys:delete',
    'roles:manage', 'permissions:read',
    'admin.audit_logs:read', 'admin.reports:read', 'admin.rbac:manage'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.deleted_at IS NULL
WHERE r.key = 'staff'
  AND p.key IN ('employees:read', 'dashboard:read')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.deleted_at IS NULL
WHERE r.key = 'viewer'
  AND p.key IN ('employees:read', 'dashboard:read')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Bootstrap default superadmin user.
INSERT INTO users (client_id, branch_id, name, email, password_hash, role, must_change_password)
SELECT c.id, NULL, 'Super Admin',
  NULLIF(current_setting('app.superadmin_email', true), ''),
  crypt(NULLIF(current_setting('app.superadmin_password', true), ''), gen_salt('bf')),
       'superadmin', true
FROM clients c
WHERE c.code = 'DEFAULT'
ON CONFLICT (email) DO NOTHING;

-- Optional password reset for existing default superadmin account.
UPDATE users
SET password_hash = crypt(NULLIF(current_setting('app.superadmin_password', true), ''), gen_salt('bf')),
    must_change_password = true,
    updated_at = now()
WHERE lower(email) = lower(NULLIF(current_setting('app.superadmin_email', true), ''))
  AND coalesce(lower(current_setting('app.superadmin_reset_password', true)), 'false') IN ('1', 'true', 'yes', 'y', 'on')
  AND deleted_at IS NULL;
