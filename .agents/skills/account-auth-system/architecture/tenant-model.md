# Tenant / Organization Architecture

The skill supports two tenant mapping modes. You must explicitly choose one for your project.

## Mode A: Parent Account as Tenant Owner
In this mode, the `parent_account` (e.g., Level 1) IS the tenant.
- Business tables use `tenant_id UUID REFERENCES user_profiles(id)`.
- For `parent_account`, `tenant_id` = `auth.uid()`.
- For `sub_account`, `tenant_id` = `parent_id`.

## Mode B: Separate Organization Table
In this mode, an explicit `organizations` table exists.
- Business tables use `organization_id UUID REFERENCES organizations(id)`.
- `user_profiles` has an `organization_id` column.
- Both `parent_account` and `sub_account` belong to the same `organization_id`.
