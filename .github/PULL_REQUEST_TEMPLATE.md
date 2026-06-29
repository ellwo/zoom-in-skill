<!--
  Use a Conventional Commit title so release-please can auto-version + changelog:
    feat: ...        -> minor release (new skill capability)  [default if unsure]
    fix: ...         -> patch release
    feat!: ...       -> major release (breaking change)
    docs/chore/refactor/test/ci: ... -> no release
-->

## Summary
<!-- What does this PR change and why? -->

## Release impact
- [ ] This should produce a release (`feat:` / `fix:` / breaking)
- [ ] This is docs/chore/ci only — no release expected

## Checklist
- [ ] `node test/version-sync.js` passes (package.json and SKILL.md versions match)
- [ ] `node test/smoke.js` passes
- [ ] No real secrets added — examples use `<redacted-...>` placeholders
