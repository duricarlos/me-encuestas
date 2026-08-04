# Design System

## Direction

Producto claro y nativo, inspirado en la precisión de Apple sin copiar marcas ni logotipos. La pantalla principal usa mucho espacio en blanco tintado, una sola acción primaria azul y controles suaves con estados explícitos.

## Color

- Canvas: `oklch(97% 0.008 250)`
- Surface: `oklch(100% 0.004 250)`
- Ink: `oklch(21% 0.018 255)`
- Muted ink: `oklch(51% 0.018 255)`
- Hairline: `oklch(88% 0.014 255)`
- Apple blue accent: `oklch(57% 0.20 255)`
- Success: `oklch(57% 0.16 150)`
- Error: `oklch(55% 0.20 25)`

Use the accent for primary actions, focus, selection and progress only. Neutrals are tinted toward blue instead of pure black or white.

## Typography

Use the system stack: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", system-ui, sans-serif`. Headings use a tight, confident weight; body copy stays relaxed and capped around 68 characters per line.

## Shape and elevation

Controls use 14px to 18px radii; the main response surface uses 28px. Borders are hairlines with low contrast. Elevation is a single soft shadow, never stacked card-on-card layouts.

## Motion

Use 180ms to 240ms ease-out transitions for hover, focus and step changes. Do not animate layout properties. Disable non-essential transitions for reduced-motion users.

## Components

- Top navigation: quiet brand mark and contextual utility.
- Primary button: blue, high contrast, 12px radius, visible focus ring.
- Option card: full-width selectable row with radio or checkbox semantics.
- Progress: thin accent bar with a numeric step label.
- Response surface: one focused question, optional description, answer control and one next action.
