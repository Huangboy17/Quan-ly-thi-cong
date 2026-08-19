# Security Principles
1. **Frontend is NOT a security boundary**. Do not rely on React components hiding elements for security.
2. **RLS is the boundary**. All business tables MUST have RLS policies linking to the tenant.
3. **No timeouts for triggers**. Use `user_metadata` deterministically.
4. **Edge Functions for Quotas**. Quota enforcement must happen on the server.
5. **Protect the Service Role Key**. Never expose it to the frontend.
