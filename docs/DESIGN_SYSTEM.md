# Ebtesamty — Design System & Visual Identity Specification

## 1. Design Philosophy
Ebtesamty is designed as a warm, modern, calm, trustworthy dental care brand serving patients and clinical teams across Cairo, Egypt.
- **Public Website & Patient Portal**: Emphasizes reassurance, clinical credibility, transparent pricing, effortless booking, and calm typography.
- **Internal Clinical & Operational Dashboards**: Emphasizes high-density legibility, rapid task completion, keyboard accessibility, unambiguous status tags, and tabular financial alignment.

---

## 2. Brand Color Palette

### Primary Brand Colors
| Token | Hex | CSS Variable | Usage |
|---|---|---|---|
| **Deep Teal (Primary)** | `#176C5B` | `--eb-teal` / `eb-teal` | Primary CTA buttons, active navigation items, links, focus rings, key interactive controls |
| **Deep Teal Hover** | `#125648` | `--eb-teal-hover` | Hover and active state for primary buttons |
| **Midnight Blue (Secondary)** | `#163447` | `--eb-midnight` / `eb-midnight` | Strong headings, structural navigation headers, executive summary accents |

### Surface & Background Colors
| Token | Hex | CSS Variable | Usage |
|---|---|---|---|
| **Warm Ivory** | `#F7F8F5` | `--eb-ivory` / `eb-ivory` | Default page background across public site, portal, and workspaces |
| **Soft Mint** | `#E3F0EB` | `--eb-mint` / `eb-mint` | Subtle highlight surfaces, selected cards, active filter pills, soft badges |
| **Pure White** | `#FFFFFF` | `--eb-white` / `eb-white` | Cards, data tables, forms, modals, and drawers |
| **Primary Ink** | `#163447` / `#1E293B` | `--eb-ink` | Body and heading typography (exceeds 10:1 contrast on Warm Ivory and White) |
| **Muted Slate** | `#52606D` | `--eb-muted` | Supporting metadata and secondary labels (meets > 4.6:1 AA contrast) |

### Decorative Accent
| Token | Hex | CSS Variable | Usage |
|---|---|---|---|
| **Muted Terracotta** | `#D58B57` | `--eb-terracotta` / `eb-terracotta` | Small decorative highlights, warm badges, subtle borders (never used for small text on white) |

### Semantic Status System (WCAG 2.2 AA Compliant)
Every status indicator pairs color with an icon or explicit text label:
- **Success / Verified**: Text `#146C43`, Background `#E8F6EE`, Border `#A3E2BF`
- **Information / Action**: Text `#164E63`, Background `#E6F4F8`, Border `#A5D8E6`
- **Pending / Warning**: Text `#8A5300`, Background `#FFF6E0`, Border `#F8D88B`
- **Error / Critical / Urgent**: Text `#B42318`, Background `#FEF3F2`, Border `#FECDCA`
- **Proposed / Draft**: Text `#5B359C`, Background `#F4EFFC`, Border `#DEC9F9`
- **Neutral / Archived**: Text `#475467`, Background `#F2F4F7`, Border `#D0D5DD`

---

## 3. Typography & Hierarchy
- **English Typeface**: `Inter` / `Plus Jakarta Sans` (`--font-sans`) for crisp UI legibility and tabular numerals; `Playfair Display` (`--font-serif`) for warm editorial accents on public headings.
- **Arabic Typeface**: `Cairo` / `IBM Plex Sans Arabic` (`--font-arabic`) with balanced line height (`1.6`) for RTL legibility.
- **Numeric Discipline**: All currency amounts (`EGP`), invoice totals, stock balances, and dates use `font-variant-numeric: tabular-nums` (`tabular-nums`).

---

## 4. Reusable Component Architecture
- `src/components/ui/BrandLogo.tsx` — Official bilingual Ebtesamty mark.
- `src/components/ui/Button.tsx` — Primary (`#176C5B`), Secondary (`#163447`), Outline, Ghost, and Danger variants with visible focus rings and loading states.
- `src/components/ui/Badge.tsx` & `StatusTag.tsx` — Non-color-dependent status badges for Booking, Visit, Payment, and Treatment states.
- `src/components/ui/Card.tsx` — Elevated surface cards with consistent `rounded-2xl` border radius and `#E2E8E5` borders.
- `src/components/ui/Alert.tsx` & `PriorityIndicator.tsx` — Operational and clinical alert banners.
- `src/components/ui/EmptyState.tsx` — Helpful empty states with clear recovery actions.
- `src/components/clinical/ToothChart.tsx` — Interactive FDI Two-Digit Odontogram (`11–48`).
- `src/components/Navbar.tsx` & `Footer.tsx` — Public website shell with mobile bottom action bar (Book, Call, Directions) and RTL switch.
- `src/components/AppShell.tsx` — Unified internal dashboard shell with collapsible role-scoped sidebar, branch context pill, global search shortcut, notification bell, and demo role switcher link.
