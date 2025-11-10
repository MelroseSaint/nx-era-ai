# Repository Cleanup Summary

Date: Current session

Changes made to remove redundant code and resolve conflicts while preserving functionality:

- Removed merge conflict markers and duplicate blocks in UI components:
  - `src/components/ui/{aspect-ratio, badge, separator, progress, checkbox, slider, switch, radio-group, scroll-area, avatar}.tsx`
  - Kept canonical shadcn/Radix implementations with `cn` utility for styling.

- Resolved merge markers in documentation and config files:
  - `README.md` (added short project note and link to this document)
  - `.gitignore` (consolidated standard ignore rules)
  - `public/robots.txt` (single set of directives)

- Environment and dev stability:
  - Aligned Vite HMR server and client to port `3001` to fix WebSocket connection errors.
  - Re-enabled `ThemeProvider` in `src/App.tsx` (next-themes wrapper) to restore theme context. `ThemeToggle` now functions with light/dark modes; custom themes can be added later.

Guidelines followed:

- Removed unused or duplicate code segments and conflict markers.
- Preserved working components and core business logic.
- Kept error handling and logging (e.g., toast usage, try/catch blocks).
- Maintained readability and organization consistent with existing project style.

Next recommendations:

- Continue resolving remaining merge markers in other UI components (e.g., `navigation-menu`, `select`, `table`, `form`, `context-menu`, etc.).
- Add styles for any custom theme variants (e.g., `black-gold`) referenced by `ThemeToggle`.
- Consider adding a CI check (typecheck and lint) to catch unused imports/variables automatically.
