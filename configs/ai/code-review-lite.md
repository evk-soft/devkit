# AI code review lite

Use this rule when an AI agent produced a small or medium code change and a full audit would be too heavy.

## Goal

Decide whether the change is safe to merge, needs more evidence, or should be escalated to a deeper review.

## Five checks

1. **Scope**
   - What was requested?
   - Which files changed?
   - Do the changed files match the request?

2. **Tests**
   - Require actual command output, not "should work".
   - Prefer a failing-before/passing-after test for bug fixes.

3. **Risk triggers**
   Escalate if the diff touches:
   - auth, sessions, roles, permissions, or tokens
   - database schema, migrations, raw SQL, or data deletion
   - secrets, credentials, filesystem writes, or shell commands
   - background jobs, queues, cron, deploy, infra, or CI/CD
   - TypeScript `any` or broad `as SomeType` at API boundaries
   - Rust `unsafe`, `unwrap()`, or `expect()` in runtime paths

4. **Independent pass**
   Ask another reviewer agent to check only for blockers:
   - missing evidence
   - correctness bugs
   - security issues
   - risky files to inspect manually

5. **Rollback**
   - Can this be reverted cleanly?
   - Are there irreversible migrations or side effects?

## Output

```md
Verdict: Approve / Request changes / Escalate
Confidence: Low / Medium / High

Evidence:
- Scope matches task: yes/no
- Tests shown: yes/no, command:
- Risk triggers: none/list
- Independent pass: yes/no
- Rollback clear: yes/no

Blocking issues:
- none/list
```

## Confidence

- **High**: tight scope, relevant tests shown, no risk triggers, rollback clear.
- **Medium**: minor evidence gap, but the diff is small and low-risk.
- **Low**: missing tests, vague scope, unexpected files, risk triggers, or unclear rollback.
