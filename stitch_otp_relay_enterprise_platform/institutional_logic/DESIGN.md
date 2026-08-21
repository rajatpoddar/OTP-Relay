---
name: Institutional Logic
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002113'
  on-tertiary-container: '#009668'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-md:
    fontFamily: manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-margin: 24px
  gutter: 16px
  section-gap: 32px
  tight: 4px
---

## Brand & Style

The design system is engineered for high-stakes government operations, emphasizing mission-critical reliability, transparency, and administrative authority. The visual language follows a **Corporate / Modern** aesthetic with a heavy focus on **Minimalism** to reduce cognitive load during high-volume data processing.

The system prioritizes institutional trust through a structured hierarchy, utilizing heavy whitespace to separate distinct functional areas. It avoids decorative elements in favor of functional clarity, ensuring that every visual cue—whether a border or a subtle shadow—serves to define the relationship between complex data sets. The emotional response is one of calm, controlled efficiency.

## Colors

The palette is anchored by "Institutional Navy" (#0F172A) to project stability and authority. This primary color is used for top-level navigation and primary headers to establish a firm boundary for the workspace. 

- **Primary:** Reserved for global navigation, structural containers, and high-level headings.
- **Secondary:** Used for interactive elements (buttons, active states, links) to provide a clear focus path without overwhelming the data.
- **Semantic Palette:** Highly distinct colors for status indicators. Success Green, Warning Amber, and Error Red are used strictly for system health, verification statuses, and audit alerts.
- **Neutrals:** A sophisticated range of Slates and Grays is used to create a tiered information architecture, distinguishing between background, containers, and borders.

## Typography

This design system utilizes a dual-font strategy. **Manrope** is used for headlines and display elements to provide a modern, refined, and professional character. **Inter** is the workhorse for all body text, data tables, and labels, selected for its exceptional legibility at small sizes and high x-height.

- **Data Density:** For table content and audit logs, `body-md` and `mono-data` are preferred to maximize information visibility.
- **Labels:** Small labels use uppercase with slight tracking to differentiate them from interactive text.
- **Mobile Scaling:** Headlines above 24px should scale down by 20% on mobile devices to maintain layout integrity.

## Layout & Spacing

The system follows a strict **8px grid** to ensure consistency across all components. A **Fluid Grid** model is used for the main dashboard areas, while sidebars and detail drawers utilize fixed widths to preserve the usability of data-heavy views.

- **Desktop:** 12-column grid with 24px margins. Use a fixed-width left navigation (240px).
- **Detail Drawers:** When active, the right-side drawer should occupy 33% of the viewport (minimum 400px), pushing the main content rather than overlaying it where possible.
- **Information Density:** For "High Density" modes, the 8px unit can be halved to 4px for padding within data tables and form groups.

## Elevation & Depth

Hierarchy is established primarily through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

- **Level 0 (Background):** Slate-50 (#F8FAFC) for the canvas.
- **Level 1 (Cards/Tables):** Pure White (#FFFFFF) with a 1px border in Slate-200. No shadow.
- **Level 2 (Dropdowns/Popovers):** Pure White with a 1px border and a subtle, soft shadow (8px blur, 4% opacity, Primary color tint).
- **Level 3 (Modals/Drawers):** Pure White with a more pronounced elevation shadow (16px blur, 8% opacity).

This approach ensures the UI remains flat and professional, avoiding a "floating" or "game-like" appearance.

## Shapes

The design system uses a **Rounded** (0.5rem / 8px) shape language. This is the optimal balance between the clinical sharpness of government documents and the approachability of modern software.

- **Small Components (Buttons, Inputs, Badges):** 8px radius.
- **Large Containers (Cards, Modals):** 12px (rounded-lg) for a more structured frame.
- **Badges:** While buttons are rounded, status badges (ACTIVE, EXPIRED) may use a smaller 4px radius to feel more like "tags" or "stamps."

## Components

### High-Density Data Tables
Rows should have a fixed height of 48px. Use alternating row stripes (Slate-50) for readability.
- **Status Badges:** Use a "Light Background + Dark Text" formula.
  - *ACTIVE:* Green-100 bg / Green-800 text.
  - *EXPIRED/SUSPENDED:* Red-100 bg / Red-800 text.
  - *TRIAL:* Blue-100 bg / Blue-800 text.

### Analytics Cards
Feature a clear `headline-sm` title, a prominent `display-md` value, and a small trend indicator (e.g., "+12% vs last month"). Progress bars should be slim (4px height) with a secondary color fill.

### Vertical Audit Timelines
A 2px solid vertical line in Slate-200 connects events. Each event "node" is a 12px circle. Use secondary color for the most recent event and Slate-300 for historical events.

### Detail Drawers
Slide-in from the right. Must contain a sticky header with a "Close" icon and a primary action button (e.g., "Edit Record"). Background is White with a left-edge border of Slate-200.

### Hierarchy Selectors
A horizontal "Breadcrumb-style" selector or a vertical "Tree" view. For government structures (State > District > Block), use a tiered dropdown approach where selection in one level filters the subsequent level.

### Navigation
- **Top Bar:** Breadcrumbs and User Profile.
- **Sidebar:** Role-specific links using `label-sm` for category headers. Use active-state indicators (left-edge 4px Primary color bar).