## Packages
recharts | For financial charts (bar, pie, area, radial)
date-fns | For date formatting and manipulation
framer-motion | For smooth page transitions and animations
clsx | For conditional class names
tailwind-merge | For merging tailwind classes

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  body: ["var(--font-body)"],
}
Authentication is handled via the local auth flow (useAuth hook).
API hooks should use @shared/routes for type safety.
