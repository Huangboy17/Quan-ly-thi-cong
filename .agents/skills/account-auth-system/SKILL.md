---
name: account-auth-system
description: >-
  A generic, reusable Authentication and Authorization architecture for SaaS/B2B projects.
  Provides a robust Multi-tier Account Hierarchy, Tenant isolation (RLS), Quota management,
  and secure Auth flows using Supabase.
---

# Account & Auth System Skill

This skill provides a generic architecture for Authentication, Authorization, and Account Management.
It is designed to be completely independent of any specific business domain.

## SKILL BEHAVIOR (Mandatory Workflow)
When an AI agent uses this skill in a new project, it MUST follow this workflow strictly:
1. **STEP 1**: Audit the current project.
2. **STEP 2**: Identify current authentication.
3. **STEP 3**: Identify current authorization.
4. **STEP 4**: Identify current database schema.
5. **STEP 5**: Identify RLS.
6. **STEP 6**: Identify tenant/ownership model.
7. **STEP 7**: Identify conflicts.
8. **STEP 8**: Propose architecture mapping.
9. **STEP 9**: Create implementation plan.
10. **STEP 10**: Wait for user approval.
11. **STEP 11**: Begin coding only after approval.
12. **STEP 12**: Test implementation.
13. **STEP 13**: Security audit.
14. **STEP 14**: Final Report.

**DO NOT** automatically break the existing authentication of the project.

## Core Concepts
- **Account Hierarchy**: `system_admin` -> `parent_account` -> `sub_account`. Configurable to project needs.
- **Account Type vs Role**: `account_type` defines hierarchy position. `role` defines business permissions within a tenant.
- **Tenant Models**: Supports Mode A (tenant_id = parent account ID) and Mode B (tenant_id = organization table).
- **Security Principles**: Frontend is NOT a security boundary. RLS and Edge Functions are the true boundaries.

See the `documentation/` and `architecture/` folders for detailed implementation guides.
