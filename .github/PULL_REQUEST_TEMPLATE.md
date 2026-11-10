## Summary of Changes

Describe the changes introduced in this Pull Request and link any related issue (e.g., `Closes #12`).

## Type of Change

- [ ] Bug fix (non-breaking change that resolves an issue)
- [ ] New repository health check or feature
- [ ] Documentation or governance update
- [ ] Test coverage or CI improvement

## Verification Checklist

- [ ] `npm run lint` passes with zero TypeScript errors
- [ ] `npm test` (Vitest) and `npm run test:node` pass
- [ ] `npm run build` succeeds cleanly
- [ ] Scoring changes in `src/lib/analyzer.ts` remain deterministic and include unit tests
- [ ] No secrets or personal access tokens are exposed in client-side code
