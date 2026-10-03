# Routes

**Routing.** Mostly flat dot-named files in `src/routes/`; `marketplace/`, `marketplace/rent/` and
`onboarding/` are real directories. `routeTree.gen.ts` is generated, never edit it.
Every route has `head()`. A route with children must render `<Outlet />` or be an `x.index.tsx`
leaf — check whether `x.tsx` exists before adding `x.y.tsx`. Never move or rename route files to
group screens.
