---
name: impeccable
description: >-
  The Impeccable design system and anti-slop frontend engineering skill by Paul Bakaus.
  Enforces professional design vocabulary, typography hierarchies, intentional palettes,
  spatial density rhythms, accessibility standards, and strict avoidance of generic AI design tropes.
---

# Impeccable Design Skill & Rules

## 1. Core Principles
- **No AI Slop**: Avoid generic centered heroes, overused purple/indigo gradients, floating purposeless pill badges, and repetitive 3-column card layouts.
- **Intentional Typography**: Establish clear typographic scale with tight negative letter-spacing for headlines (`-0.03em`), high contrast, and tabular figures for numbers.
- **Micro-Interactions**: Subtle, physics-informed transitions (`transform: translateY(-2px)`, subtle inset glow, cubic-bezier curves).
- **Spatial Rhythm**: High breathing room, distinct primary vs. secondary content separation, semantic depth layers.
- **High Contrast & Accessibility**: WCAG AA compliance ($contrast \ge 4.5:1$), visible keyboard focus indicators, legible typography on light and dark surfaces.

## 2. Anti-Patterns (Strictly Avoid)
- **Nested Card Fatigue**: Do not nest cards inside cards with identical borders and radiuses.
- **Gray-on-Color**: Never put low-contrast gray text on dark or vibrant colored backgrounds.
- **Bouncy Gimmick Motion**: Avoid cartoonish bounce/elastic easings; use snappy, dampened curves (e.g., `cubic-bezier(0.16, 1, 0.3, 1)`).
- **Default AI Color Schemes**: Avoid raw `#8b5cf6` or generic gradients. Use curated, brand-specific palettes (Deep Academy Navy `#0f172a` / `#1e3a8a`, Wisdom Cyan `#0891b2`, Warm Gold `#d97706`).

## 3. Impeccable Design Tokens
- Border Radius Scale: `xs: 6px`, `sm: 10px`, `md: 14px`, `lg: 20px`, `xl: 28px`, `full: 9999px`.
- Shadows: Multi-layer soft elevation (`0 1px 3px rgba(0,0,0,0.05), 0 20px 40px -15px rgba(15,23,42,0.07)`).
- Glassmorphism: Reserved for floating navigation and modals (`backdrop-filter: blur(16px)`, `background: rgba(255, 255, 255, 0.85)` with subtle 1px border).
