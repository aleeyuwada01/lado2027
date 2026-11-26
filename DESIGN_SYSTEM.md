# Design System — Institutional Command & Situation Room UI

## Typography
- **Display & Headings**: `Plus Jakarta Sans`
- **Operational UI & Body**: `Public Sans`
- **Numeric KPIs, Timestamps & Reference Codes**: `IBM Plex Mono` with `tabular-nums` alignment (`font-mono tabular-nums`).

## Palette & Themes
- **Light Command Theme**: Clean canvas `#F6F8FA`, crisp white card surfaces `#FFFFFF`, 1px slate borders (`border-slate-200`), dark slate sidebar `#0B1324`.
- **Dark Situation Room Theme**: Deep navy canvas `#090E1A`, elevated panel surfaces `#0F172A`, crisp `border-slate-800` framing.
- **Dynamic Campaign Brand Tokens**: `--campaign-primary` (default `#0F5132`) and `--campaign-accent` (default `#B45309`), live-configurable in Settings & Administration.

## Visual Discipline
- Single-elevation flat cards with clean borders (no excessive drop shadows or glassmorphism clutter).
- Zero static pill wrappers on inline metadata; uses clean typographic separators (`·`) and semantic text color for severity/verification states.
- Full-screen Wall Display Mode for HQ situation room monitors.
- Print-optimized stylesheet (`@media print`) hiding navigation chrome for clean executive report printing.
