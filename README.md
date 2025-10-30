# Kapify Design System - An Implementation Guide

## Quick Start

## When given a Tailwind component HTML, transform it using this guide to match the premium design system. Replace all styling with the specifications below.

## Core Color Palette

### Primary Color: teal

- **Base**: `teal-500` — Main CTAs, active states, progress indicators
- **Hover**: `teal-600` — Button hover state
- **Active**: `teal-700` — Button pressed/active state
- **Light**: `teal-50` — Light backgrounds for current/active sections
- **Accent**: `teal-400` — Progress bars, gradients

### Neutral Colors: Slate

- **Background**: `slate-50` — Page background, light sections
- **Surface**: `white` — Cards, containers, primary surfaces
- **Border**: `slate-200` — Borders (use with `/50` opacity for softer effect: `slate-200/50`)
- **Text Primary**: `slate-900` — Main text, headings
- **Text Secondary**: `slate-600` — Helper text, metadata
- **Text Tertiary**: `slate-500` — Disabled text, hints
- **Disabled**: `slate-100` — Disabled button backgrounds

### Success Colors: Green

- **Base**: `green-600` — Icons/indicators for completed items
- **Light**: `green-50` — Background for completed sections
- **Text**: `green-700` / `green-900` — Success text

### Status Colors: Red

- **Base**: `red-600` — Errors, required indicators
- **Light**: `red-50` — Error backgrounds
- **Border**: `red-200/50` — Error borders (semi-transparent)
- **Text**: `red-700` — Error text

### Status Colors: Amber

- **Base**: `amber-600` — Warnings, pending states
- **Light**: `amber-50` — Warning backgrounds
- **Border**: `amber-200/50` — Warning borders
- **Text**: `amber-700` — Warning text

### Status Colors: Blue

- **Base**: `blue-600` — Info, secondary actions
- **Light**: `blue-50` — Info backgrounds
- **Border**: `blue-200/50` — Info borders
- **Text**: `blue-700` — Info text

---

## Typography

### Font Weights

- **Bold**: `font-bold` — Page titles, section headings
- **Semibold**: `font-semibold` — Card titles, important labels
- **Medium**: `font-medium` — Button labels, emphasis
- **Regular**: Default — Body text, descriptions

### Heading Sizes

- **Page Title**: `text-3xl font-bold` — Main page headers
- **Section Title**: `text-xl font-bold` — Major sections
- **Card Title**: `text-lg font-bold` / `text-base font-semibold` — Component headers
- **Label**: `text-sm font-semibold` — Form labels, small titles
- **Small Label**: `text-xs font-semibold` — Metadata, uppercase tracking labels

### Body Text Sizes

- **Standard**: `text-sm` — Default body, button text
- **Secondary**: `text-xs` — Helper text, metadata, small print
- **Large**: `text-base` — Emphasized body text

### Text Colors

- Primary heading: `text-slate-900`
- Secondary text: `text-slate-600`
- Tertiary text: `text-slate-500`
- Disabled text: `text-slate-400`
- Success text: `text-green-700`
- Error text: `text-red-700`
- Warning text: `text-amber-700`

---

## Spacing

### Consistent Scale

- **xs**: `2px` (0.5)
- **sm**: `4px` (1)
- **md**: `8px` (2)
- **lg**: `12px` (3)
- **xl**: `16px` (4)
- **2xl**: `24px` (6)
- **3xl**: `32px` (8)
- **4xl**: `48px` (12)

### Container Padding

- **Desktop Header**: `px-8 py-6` — Large top-level headers
- **Desktop Content**: `px-8 py-6` — Main content areas
- **Card Interior**: `px-6 py-4` — Standard card padding
- **Component Interior**: `px-4 py-3` — Smaller components
- **Form Input Padding**: `px-4 py-2.5` — Input fields
- **Button Padding**: `px-6 py-2.5` — Standard buttons

### Section Spacing

- **Between elements**: `gap-4` / `space-y-4` — Default spacing
- **Tight spacing**: `gap-2` / `space-y-2` — Related elements
- **Loose spacing**: `gap-6` / `space-y-6` — Major section breaks
- **Container margins**: `mx-auto px-8` — Desktop, `mx-auto px-4 lg:px-8` — Responsive

---

## Borders & Shadows

### Border Radius

- **Cards/Containers**: `rounded-2xl` — Major components
- **Buttons/Inputs**: `rounded-xl` — Interactive elements
- **Small Elements**: `rounded-lg` — Badges, small buttons
- **Circles**: `rounded-full` — Avatar-like elements
- **Icons**: `rounded-lg` (for icon backgrounds)

### Border Styling

- **Standard border**: `border border-slate-200`
- **Soft border**: `border border-slate-200/50` — Semi-transparent
- **Colored borders**:
  - Complete: `border-green-200/50`
  - Current: `border-teal-300/50`
  - Available: `border-slate-200`
  - Locked: `border-slate-200 opacity-60`
  - Error: `border-red-200/50`
  - Warning: `border-amber-200/50`

### Shadows

- **Subtle**: `shadow-sm` — Hover states, lifted elements
- **Standard**: `shadow-md` — Cards, modals (rare)
- **No shadow**: Default — Most cards

### Hover & Active States

- **Card hover**: `hover:shadow-md hover:border-slate-300`
- **Button hover**: `hover:bg-[color-600]` (one shade darker)
- **Button active**: `active:bg-[color-700]` (two shades darker)
- **Transition**: `transition-all duration-200` — All hover/active

---

## Buttons

### Primary Button

```
bg-teal-500 text-white font-medium rounded-xl
hover:bg-teal-600 active:bg-teal-700
px-6 py-2.5 text-sm
transition-colors duration-200
disabled:opacity-50 disabled:cursor-not-allowed
```

### Secondary Button (Outline/Slate)

```
bg-slate-100 text-slate-700 font-medium rounded-xl
hover:bg-slate-200 active:bg-slate-300
px-4 py-2.5 text-sm
transition-colors duration-200
```

### Ghost Button (Minimal)

```
text-slate-600 font-medium
hover:bg-slate-100 active:bg-slate-200
px-4 py-2.5 text-sm
transition-colors duration-200
```

### Button Sizes

- **Large**: `px-6 py-3` — `text-base`
- **Standard**: `px-6 py-2.5` — `text-sm`
- **Small**: `px-4 py-2` — `text-xs`
- **Icon-only**: `p-2` — Usually `-ml-2` / `-mr-2` for alignment

### Button States

- **Loading**: Spinner icon + "Saving..." text, disabled
- **Disabled**: `opacity-50 cursor-not-allowed`, cannot click
- **Hover**: Always has hover state unless disabled

---

## Form Elements

### Input Fields

```
w-full px-4 py-2.5
border border-slate-200
rounded-xl
text-slate-900 placeholder-slate-400
focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
transition-all duration-200
```

### Input States

- **Focus**: `ring-2 ring-teal-500` (not blue)
- **Error**: `border-red-300` (no ring)
- **Disabled**: `bg-slate-50 cursor-not-allowed opacity-60`

### Labels

```
block text-sm font-semibold text-slate-900 mb-2
```

- Required indicator: `<span class="text-teal-500">*</span>`
- Optional indicator: `<span class="text-slate-400 font-normal">(Optional)</span>`

### Select Dropdowns

## Same as inputs, add `bg-white`

## Cards & Containers

### Standard Card

```
bg-white rounded-2xl border border-slate-200 shadow-sm
p-6 (interior padding)
```

### Card Header

```
px-8 py-6 border-b border-slate-200 bg-slate-50/50
```

### Card with Accent

For current/active state:

```
bg-teal-50 border border-teal-300/50
```

For success/complete state:

```
bg-green-50 border border-green-200/50
```

### Card Hover

```
hover:shadow-md hover:border-slate-300 transition-all duration-200
```

---

## Progress Bars

### Standard Progress

```
h-2 bg-slate-100 rounded-full overflow-hidden
<div class="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-700 ease-out" style="width: X%"></div>
```

### Compact Progress

```
h-1.5 bg-slate-100 rounded-full overflow-hidden
<div class="h-full bg-gradient-to-r from-teal-400 to-teal-500" style="width: X%"></div>
```

### Gradient Direction

## Always use: `from-teal-400 to-teal-500` (light to dark teal)

## Badge Styling

### Status Badges

- **Complete**: `bg-green-50 text-green-700 border border-green-200/50`
- **Current**: `bg-teal-50 text-teal-700 border border-teal-300/50`
- **Pending**: `bg-amber-50 text-amber-700 border border-amber-200/50`
- **Error**: `bg-red-50 text-red-700 border border-red-200/50`
- **Info**: `bg-blue-50 text-blue-700 border border-blue-200/50`

### Badge Sizing

- Standard: `px-2.5 py-1 rounded-full text-xs font-semibold`
- Compact: `px-2 py-0.5 rounded-lg text-xs font-medium`

---

## Icons

### Icon Sizing

- **Large**: `[size]="32"` — Section headers, empty states
- **Standard**: `[size]="20"` — Button icons, navigation
- **Small**: `[size]="16"` — Inline icons, badges
- **Tiny**: `[size]="12"` — Metadata icons

### Icon Backgrounds

```
w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
```

- Success: `bg-green-100 text-green-600`
- teal: `bg-teal-100 text-teal-600`
- Blue: `bg-blue-100 text-blue-600`
- Slate: `bg-slate-100 text-slate-600`

### Icon Positioning

- Inline with text: `mr-2` or `mr-1.5`
- Standalone: No margin

---

## Transitions & Animations

### Timing Functions

- **UI Elements**: `duration-200` (hover, focus, toggle)
- **Progress Indicators**: `duration-700` (smooth fill)
- **Modals/Drawers**: `duration-300` (slide in/out)
- **All**: `transition-all` or `transition-colors` / `transition-opacity` as needed
- **Easing**: `ease-out` for standard, `cubic-bezier(0.4, 0, 0.2, 1)` for smooth

### Animations to Implement

- **Spin**: `animate-spin` for loading spinners
- **Fade in**: Opacity 0 → 1 over 300ms
- **Slide in**: Transform translateX/Y over 300ms
- **Button press**: Active state color change instantly

---

## Responsive Design

### Breakpoints (Tailwind Standard)

- **Mobile**: No prefix — `px-4 py-3`
- **Tablet (md)**: `md:` prefix
- **Desktop (lg)**: `lg:` prefix — `lg:px-8 lg:py-6`

### Common Patterns

```html
<!-- Responsive padding -->
px-4 lg:px-8
<!-- Responsive text -->
text-base lg:text-lg
<!-- Show/hide -->
hidden lg:block (show on desktop only) lg:hidden (hide on desktop)
<!-- Grid -->
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
```

### Mobile Navigation

- **Header**: Sticky with hamburger menu
- **Drawer**: Fixed overlay, z-50, slides from left
- **Backdrop**: `bg-black/25 backdrop-blur-sm`

---

## Focus & Accessibility

### Focus Indicator

```
focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
```

- Used on all interactive elements (buttons, inputs, card buttons)
- teal color (never blue)
- 2px ring with offset

### Disabled State

- CSS: `disabled:opacity-50 disabled:cursor-not-allowed`
- HTML: `disabled` attribute on buttons/inputs
- Styling: Reduce opacity, change cursor

### Color Contrast

- All text must be readable against background
- Dark text on light backgrounds
- Light text on dark backgrounds only for CTAs

---

## Common Components

### Alert/Error Box

```
bg-red-50 border border-red-200/50 rounded-xl p-4
flex items-center gap-3
<icon: alert-circle> <text: red-700>
```

### Info/Warning Box

```
bg-amber-50 border border-amber-200/50 rounded-xl p-2.5
flex items-start gap-2
<icon: alert-circle> <text: amber-700, small>
```

### Modal/Drawer Header

```
px-6 py-4 border-b border-slate-200 flex items-center justify-between
```

### Empty State

```
text-center py-12
<icon: 48px gray-300>
<title: text-lg font-bold slate-900>
<description: text-slate-600>
<button: teal primary>
```

---

## State-Based Styling

### Step/Item States

#### Completed

```
Icon: bg-green-600 text-white
Card: bg-green-50 border-green-200/50
Text: text-green-900
```

#### Current/Active

```
Icon: bg-teal-500 text-white
Card: bg-teal-50 border-teal-300/50
Text: text-teal-900
```

#### Available

```
Icon: bg-slate-100 text-slate-600
Card: bg-white border-slate-200
Text: text-slate-900
```

#### Locked/Disabled

```
Icon: bg-slate-100 text-slate-400
Card: bg-slate-50 border-slate-200 opacity-60
Text: text-slate-500
```

---

## Layout Patterns

### Two-Column Layout (Desktop Sidebar)

```html
<div class="flex h-screen">
  <main class="flex-1 flex flex-col overflow-hidden">
    <!-- Content -->
  </main>
  <div class="hidden lg:flex lg:w-80 flex-col sticky top-0 h-screen z-40 bg-white border-l border-slate-200">
    <!-- Sidebar -->
  </div>
</div>
```

### Max-Width Container

```html
<div class="max-w-6xl mx-auto px-8 py-8">
  <!-- Content -->
</div>
```

### Sticky Header + Footer

```html
<header class="sticky top-0 z-30 bg-white border-b border-slate-200">
  <!-- Footer -->
  <footer class="sticky bottom-0 z-30 bg-white border-t border-slate-200"></footer>
</header>
```

---

## Anti-Patterns (What NOT to Do)

❌ Don't use `primary-500` or `primary-600` — Use `teal-500` / `teal-600`
❌ Don't use `gray-*` — Use `slate-*`
❌ Don't use `bg-neutral-*` — Use `bg-white` or `bg-slate-*`
❌ Don't use `rounded-md` / `rounded-lg` — Use `rounded-xl` / `rounded-2xl`
❌ Don't use `.withOpacity()` in code — Use opacity values like `bg-slate-200/50`
❌ Don't use blue focus rings — Always use teal
❌ Don't add excessive shadows — Use `shadow-sm` sparingly
❌ Don't mix color systems — Stick to slate/teal/green/red/amber
❌ Don't use full opacity on borders — Use `/50` semi-transparent
❌ Don't use quick transitions — Minimum `duration-200`

---

## Example Transformations

### Bad → Good

**Bad Component:**

```html
<div class="bg-gray-100 rounded-lg p-4 border border-gray-300">
  <h3 class="text-black font-bold text-xl">Title</h3>
  <button class="bg-blue-500 text-white rounded px-4 py-2">Click</button>
</div>
```

**Good Component:**

```html
<div class="bg-white rounded-2xl p-6 border border-slate-200">
  <h3 class="text-slate-900 font-bold text-lg">Title</h3>
  <button class="bg-teal-500 text-white rounded-xl px-6 py-2.5 hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200">Click</button>
</div>
```

---

## Quick Reference Cheat Sheet

| Element            | Color              | Rounded        | Padding       | Font                    |
| ------------------ | ------------------ | -------------- | ------------- | ----------------------- |
| Page               | `bg-slate-50`      | —              | `px-8 py-6`   | —                       |
| Card               | `bg-white`         | `rounded-2xl`  | `p-6`         | —                       |
| Button (Primary)   | `bg-teal-500`      | `rounded-xl`   | `px-6 py-2.5` | `text-sm font-medium`   |
| Button (Secondary) | `bg-slate-100`     | `rounded-xl`   | `px-4 py-2.5` | `text-sm font-medium`   |
| Input              | `border-slate-200` | `rounded-xl`   | `px-4 py-2.5` | `text-sm`               |
| Label              | `text-slate-900`   | —              | —             | `text-sm font-semibold` |
| Heading            | `text-slate-900`   | —              | —             | `text-3xl font-bold`    |
| Badge (Status)     | `bg-[status]-50`   | `rounded-full` | `px-2.5 py-1` | `text-xs font-semibold` |

---

## Final Notes

1. **Consistency is key** — Use exact color values, never approximate
2. **Gradients are teal** — `from-teal-400 to-teal-500`
3. **Borders are soft** — Always consider `/50` opacity
4. **Spacing is generous** — Better to be too much than too little
5. **Transitions matter** — Add them to all interactive states
6. **Focus rings are teal** — Never blue, always 2px with offset
7. **Icons are contextual** — Color matches the state/purpose
8. **Mobile first** — Start with mobile classes, add `lg:` for desktop
