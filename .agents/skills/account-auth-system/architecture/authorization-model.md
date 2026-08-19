# Authorization Model

Authorization is evaluated based on:
1. **Authenticated Session**: Checked via Supabase Auth.
2. **Account Type**: `system_admin`, `parent_account`, `sub_account`.
3. **Status**: `active`, `pending`, `blocked`, `rejected`.
4. **Ownership / Tenant**: Enforced by Database RLS.

## Account Type vs Role
- **`account_type`**: Structural. Determines where the user sits in the tenant hierarchy. Used for routing (Admin Area vs Tenant Area) and quota limits.
- **`role`**: Business-specific. e.g., `manager`, `engineer`, `viewer`. Used by frontend and RLS to allow/deny specific actions *within* the tenant's boundary.

## Guarding Principles
- **Never rely purely on frontend `role` checks.**
- If a user's status is not `active`, they MUST be blocked from the protected application completely.
