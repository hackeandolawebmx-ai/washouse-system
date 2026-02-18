# Design System: Washouse System (Electric Ocean)

## 1. Typography
**Primary Font**: Inter (Google Fonts)

| Scale | Mobile | Desktop | Weight | Line Height | Letter Spacing |
|-------|--------|---------|--------|-------------|----------------|
| H1 | 32px | 48px | Bold (700) | 1.1 | -0.02em |
| H2 | 24px | 32px | Bold (700) | 1.2 | -0.01em |
| H3 | 20px | 24px | Semibold (600) | 1.3 | -0.01em |
| Body | 16px | 16px | Regular (400) | 1.5 | 0 |
| Small | 14px | 14px | Regular (400) | 1.5 | 0 |
| Tiny | 12px | 12px | Medium (500) | 1.5 | 0.02em |

## 2. Colors (Semantic Mapping)
We map the legacy `washouse-*` colors to semantic tokens for better maintainability.

### Brand
- **Primary**: `washouse-blue` (#0099DD) -> Main actions, links, active states.
- **Secondary**: `washouse-aqua` (#40E0D0) -> Accents, success states, gradients.
- **Deep**: `washouse-navy` (#0F172A) -> Headings, dark backgrounds, heavily emphasized text.

### Surface
- **Background**: `washouse-surface` (#F8FAFC) -> Page background.
- **Card**: `white` (#FFFFFF) -> Card background, modals, dropdowns.
- **Overlay**: `black/50` -> Modal backdrops.

### State
- **Success**: `emerald-500`
- **Warning**: `amber-500`
- **Error**: `rose-500`
- **Info**: `sky-500`

## 3. Shadows (Depth)
We use a layered shadow approach to create depth without harsh borders.

- **sm**: `0 1px 2px 0 rgb(0 0 0 / 0.05)` -> Buttons, inputs.
- **md**: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` -> Cards, dropdowns.
- **lg**: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` -> Modals, floating actions.
- **glow**: `0 0 15px rgba(0, 153, 221, 0.3)` -> Active states, primary buttons focus.

## 4. Animation
Standard interactions should feel instant yet smooth.

- **Duration**:
    - **Fast**: 150ms (Hover, scale, opacity)
    - **Normal**: 300ms (Slide, fade in, modal open)
    - **Slow**: 500ms (Complex layout shifts)
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design Standard)

## 5. Components
### Buttons
- **Primary**: Gradient `washouse-gradient`, White text, Shadow-md, Scale on active.
- **Secondary**: White bg, Border gray-200, Text navy, Hover gray-50.
- **Ghost**: Transparent bg, Text navy, Hover bg-gray-100.

### Cards
- White background
- Rounded-xl (24px for large containers, 16px for internal cards)
- Border gray-100 (Subtle definition)
