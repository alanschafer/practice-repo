---
title: "Designing with Type"
date: 2026-10-12 09:00:00 -0500
lede: "Why one elegant serif and one quiet sans can carry an entire site."
tags: [design, typography]
---

Typography does most of the work on the web. Before color, before images, there's the shape of the letters and the space between them.

## Contrast, not clutter

This site pairs **Instrument Serif**, a high-contrast display face, with **Switzer**, a calm sans-serif for reading. One speaks; the other listens.

| Role     | Typeface         | Used for              |
|----------|------------------|-----------------------|
| Display  | Instrument Serif | Headlines, big moments |
| Body     | Switzer          | Paragraphs, UI        |
| Code     | JetBrains Mono   | Snippets              |

## A tiny bit of CSS

```css
h1 {
  font-family: "Instrument Serif", serif;
  font-size: clamp(3rem, 9vw, 8rem);
  letter-spacing: -0.03em;
  line-height: 0.95;
}
```

Fewer styles, used with intention, almost always look more refined than many.
