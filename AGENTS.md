# Project Guidance

## User Preferences

- Freelance ERP consultant context — single-consultant business, not a multi-team agency
- Business-tool information density: clear navigation hierarchy, data-dense tables and dashboards

## Verified Commands

- **typecheck**: `mops check --fix`
- **build**: `mops build`

## Learnings

- Under enhanced migration, derived view records built from stable maps must be declared `transient let` in the actor body; a plain `let` is implicitly stable and fails with M0250/M0267.
- check-limit=1 permits only one pending migration; fold all changes into the latest pending file and remove earlier pending files.
- caffeineai-oql 0.7.1 has no Value instance for optional types; a `.payload` extractor over a `?T` field must unwrap it (e.g. `?? 0`).
- Private helper functions declared in multiple mixins collide when all mixins are included into one actor (M0051); give each mixin's helper a domain-specific name.
- shadcn's sonner Toaster must be explicitly rendered in the app tree; defining components/ui/sonner.tsx alone does not mount it, so all toast calls become no-ops.
- date-fns format() throws RangeError on an Invalid Date; guard month-label helpers with Number.isFinite and a 1-12 month range check before constructing the Date.
- A recharts ChartConfig key must match the Bar/Line dataKey, otherwise the tooltip label silently shows the wrong series name.
- The shadcn sidebar primitive depends on next-themes useTheme, which the template does not provide; build a custom sidebar rail instead.
- Backend enums are value enums in backend.d.ts; re-export them as values from a domain types module and use enum members rather than string literals.
- PocketIC backend lane tests must authenticate the actor with a non-anonymous sender and pass complete Candid records (all optional keys present) or every data call traps.
