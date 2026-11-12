# Wagging With GG — Style Guide & Design System Reference

This document captures the design system, tokens, typography, color palette, spacing, and UI components from the Pawcare Webflow Template Style Guide (`/template-pages/style-guide`) for ongoing development on the **Wagging With GG** website.

---

## 1. Color Palette

### Primary & Secondary Colors
| Token / Variable | Hex / Value | Usage |
| :--- | :--- | :--- |
| `--core--colors--primary--100` | `#7979ff` | Primary brand accent, primary buttons, active states, links |
| `--core--colors--secondary--100` | `#ff9466` | Warm coral accent, secondary highlights, badges |
| `--core--colors--secondary--200` | `#ffdf79` | Warm yellow accent, decorative shapes, highlights |
| `--core--colors--secondary--300` | `#b8ecff` | Soft sky blue accent, icon backgrounds, cards |
| `--core--colors--secondary--400` | `#d0f3a2` | Soft mint/lime green accent |

### Neutral Colors
| Token / Variable | Hex / Value | Usage |
| :--- | :--- | :--- |
| `--core--colors--neutral--800` | `#353564` | Headings, dark text titles (`.text-titles`), dark surfaces |
| `--core--colors--neutral--700` | `#565687` | Subheadings, strong body copy (`.text-neutral-700`) |
| `--core--colors--neutral--600` | `#7b7ba0` | Default body text, paragraphs |
| `--core--colors--neutral--500` | `#b4b9c9` | Muted text, placeholders |
| `--core--colors--neutral--400` | `#c6c6e0` | Borders, dividers |
| `--core--colors--neutral--300` | `#ececff` | Light borders, subtle card outlines |
| `--core--colors--neutral--200` | `#f7f7ff` | Soft lavender-tinted section backgrounds (`.bg-secondary-100`, `.hero-v9`) |
| `--core--colors--neutral--100` | `#ffffff` | White card surfaces, page backgrounds, light text |

---

## 2. Typography & Fonts

### Font Families
- **Primary / Headings & Body (`--core--font-family--primary-font`)**: `Lineseedsans, Arial, sans-serif`
  - Local font files in `assets/fonts/`:
    - `679d0e1b42a71932083a7f57_LINESeedSans_Thin.woff` (`100`)
    - `679d0e1a236c2aa391997c25_LINESeedSans_Regular.woff` (`400`)
    - `679d0e1afa4dd8b437ab851d_LINESeedSans_Bold.woff` (`700`)
    - `679d0e1aaa9bae159ee07ae4_LINESeedSans_Extra_Bold.woff` (`800`)
- **Secondary Font (`--core--font-family--secondary-font`)**: `Montserrat, sans-serif` (loaded via Google WebFont Loader alongside `Inter` and `Source Code Pro`)
- **Icon Fonts** (in `assets/fonts/`):
  - `66e0b7f86ad7b7ccc7926275_line-rounded-icon-font-brix.woff` (`Line Rounded Icon Font Brix`, `.icon-font-rounded`)
  - `678e76e05696eb7b356eaccd_social-media-icon-brix.woff` (`Social Media Icon Font Brix`, `.icon-font-social-media`)
  - `66e0b7f86ad7b7ccc79263e3_fontello.woff` & `66e0b7f86ad7b7ccc79263e6_fontello.woff`

### Display Scale
| Class | CSS Variable | Desktop Size | Line Height |
| :--- | :--- | :--- | :--- |
| `.display-10` | `--displays--display-10` | `80px` | `1.115em` |
| `.display-9` | `--displays--display-9` | `58px` | `1.115em` |
| `.display-8` | `--displays--display-8` | `48px` | `1.115em` |
| `.display-7` | `--displays--display-7` | `38px` | `1.25em` |
| `.display-6` | `--displays--display-6` | `30px` | `1.25em` |
| `.display-5` | `--displays--display-5` | `22px` | `1.25em` |
| `.display-4` | `--displays--display-4` | `20px` | `1.5em` |
| `.display-3` | `--displays--display-3` | `18px` | `1.5em` |
| `.display-2` | `--displays--display-2` | `14px` | `1.5em` |
| `.display-1` | `--displays--display-1` | `12px` | `1.5em` |

### Font Weight Modifiers
- `.strong` — Bold (`700`)
- `.mid` — Medium/Regular (`500`/`400`)
- `.paragraph-large` / `.paragraph-extra-large` — Enlarged body copy

---

## 3. Spacing, Border Radius & Shadows

### Main Spacers
- `--main-spacers--4x-extra-small`: `8px`
- `--main-spacers--3x-extra-small`: `12px`
- `--main-spacers--extra-small`: `20px`
- `--main-spacers--small`: `24px`
- `--main-spacers--regular`: `32px`
- `--main-spacers--medium`: `40px`
- `--main-spacers--large`: `48px`
- `--main-spacers--3x-extra-large`: `72px`
- `--main-spacers--5x-extra-large`: `100px`
- `--main-spacers--6x-extra-large`: `120px`
- `--main-spacers--8x-extra-large`: `160px`

### Border Radius
- `--border-radius--br-4x-extra-small`: `2px`
- `--border-radius--br-small`: `16px`
- `--border-radius--br-regular`: `24px`
- `--border-radius--br-medium`: `32px`
- `--border-radius--br-extra-large`: `48px`
- `--border-radius--br-4x-extra-large`: `300px` (pill shape for buttons & badges)

---

## 4. Key UI Components & Classes

- **Buttons**:
  - `.primary-button.w-inline-block`: Pill-shaped primary button (`#7979ff` background, white text, hover lift effect)
  - `.secondary-button.w-inline-block`: Outlined/light secondary button (`#353564` text, subtle border, hover transition)
- **Cards**:
  - `.card`: Base card container with rounded corners and soft shadow
  - `.card-service`: Service showcase card with icon, heading, description, and image
  - `.card.content-top-footer`: Dark purple/navy CTA banner card at the top of the footer
- **Layout Containers**:
  - `.container-default.w-container`: Standard centered max-width container (`1268px` max-width with `24px` horizontal padding)
  - `.w-layout-grid.grid-2-columns`, `.grid-3-columns`, `.grid-4-columns`: Responsive CSS Grid layouts
- **Animations (Webflow IX2)**:
  - Driven by `data-wf-site="66e0b7f86ad7b7ccc792620c"`, per-page `data-wf-page` IDs on `<html>`, and `data-w-id` attributes on interactive/animated DOM elements via `assets/js/webflow.schunk.e6e518dcdffde121.js`.

