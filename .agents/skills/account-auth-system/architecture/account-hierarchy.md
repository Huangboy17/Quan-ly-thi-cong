# Account Hierarchy

The system models a generic multi-tier account structure.

## Structure
```text
system_admin
  ↓
parent_account
  ↓
sub_account
```

## Mapping Configuration
In your project, you can map these to domain-specific concepts:
- `system_admin` = `super_admin`
- `parent_account` = `level_1` | `company` | `agency`
- `sub_account` = `level_2` | `employee` | `staff`

## Expansion
The hierarchy can be expanded (e.g., Level 3) by chaining the `parent_id` relation, provided RLS policies are updated accordingly to traverse the hierarchy (using materialized paths or simple joins if depth is fixed).
