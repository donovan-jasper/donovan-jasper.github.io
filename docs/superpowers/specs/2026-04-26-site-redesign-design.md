# insecurity.dev / donovan-jasper.github.io Redesign Spec

## Overview

Rebuild Donovan Jasper's personal site from Hugo/Hextra to Astro with a custom dark/light theme. Same content and structure, dramatically improved visual design with animations and interactivity.

## Framework

- **Astro** with static output
- **Deployment:** GitHub Pages (same repo: donovan-jasper/donovan-jasper.github.io)
- **Content:** Markdown/MDX via Astro content collections
- **Styling:** Tailwind CSS
- **Animations:** Astro View Transitions API

## Design System

### Dark Mode (default)
- **Background:** #111118 (blue-black gradient to #0d0d14)
- **Text primary:** #e0e0e0
- **Text secondary:** #999
- **Text muted:** #555
- **Accent:** #818cf8 (indigo)
- **Borders:** rgba(255,255,255,0.06)
- **Heading font:** Space Grotesk (700)
- **Body font:** Inter (400, 500, 600)

### Light Mode (toggle)
- **Background:** #faf8f5 (warm cream)
- **Text primary:** #1a1a1a
- **Text secondary:** #333
- **Text muted:** #666
- **Accent:** #92400e (warm brown)
- **Borders:** #e8e4de
- **Body font:** Literata (400, 600, 700)
- **Nav/UI font:** Inter or Space Grotesk (carry from dark mode for continuity)

### Typography Scale
- Nav items: 13px
- Body text: 14px (dark) / 15px (light)
- Line height: 1.8
- Headings: Space Grotesk, letter-spacing: -0.3px

## Navigation

### Top Nav (all pages)
- Left: "Donovan Jasper" (name as logo, Space Grotesk bold)
- Right: Home | Tech | Arts | Portfolio | Other Projects
- Theme toggle button (sun/moon icon)

### Sidebar (Tech and Arts sub-pages)
- Collapsible tree structure
- Tech > Cybersecurity > Research (ARTEMIS, Cybench, HotelDruid) / HackTheBox (Resource, Compiled)
- Arts > Voice (individual songs) / Dance (individual performances)
- Active page highlighted with accent color
- Breadcrumb above content area

## Pages

### Homepage (_index.md → index.astro)
- Bio paragraph (same text)
- Headshot photo displayed as portrait, not cropped circular
- NCCDC team photo, ballet/singing photos
- Contact cards (LinkedIn, GitHub, Email, Twitter)

### Portfolio (portfolio.md → portfolio.astro or portfolio.mdx)
- Tabbed layout: Tech | Arts
- Experience, Education, Research, Publications, Honors sections
- All existing content preserved

### Tech sub-pages
- Research: ARTEMIS, Cybench, HotelDruid
- HackTheBox: Resource, Compiled writeups
- Sidebar navigation between pages

### Arts sub-pages
- Voice: individual song pages with YouTube embeds
- Dance: individual performance pages with YouTube embeds
- Sidebar navigation between pages

### Other Projects
- Card layout linking to sub-pages

## Animations

- **View Transitions:** Crossfade between pages (Astro built-in)
- **Scroll animations:** Sections fade/slide in on scroll (CSS + Intersection Observer)
- **Theme toggle:** Smooth color transition (CSS transition on custom properties)
- **Hover states:** Links, cards, nav items have subtle transitions
- **No heavy JS libraries** (no Framer Motion, no GSAP)

## Image Handling

- Headshot (donovanface.jpeg): portrait orientation, ~20% width, natural rectangle
- Team photo (nccdc2023.jpg): wide, ~80% width
- Performance photos (ballet2.png, singing2.png): side by side, ~45% each
- All images use Astro's built-in image optimization

## File Structure

```
src/
  layouts/
    Base.astro          # HTML shell, fonts, theme toggle
    Main.astro          # Top nav + main content (no sidebar)
    Docs.astro          # Top nav + sidebar + content
  components/
    Nav.astro           # Top navigation bar
    Sidebar.astro       # Collapsible sidebar for Tech/Arts
    ThemeToggle.astro   # Dark/light mode toggle
    ContactCards.astro  # LinkedIn/GitHub/Email/Twitter cards
    Tabs.astro          # Tab component for Portfolio
  pages/
    index.astro         # Homepage
    portfolio.astro     # Portfolio page
    tech/...            # Tech sub-pages (can use content collections)
    arts/...            # Arts sub-pages
    other-projects/...  # Other projects
  content/
    tech/               # Markdown content for tech pages
    arts/               # Markdown content for arts pages
  styles/
    global.css          # Tailwind + custom properties + theme variables
public/
  images/              # All images from current static/images
  favicon.svg          # Existing favicons
```

## Migration Checklist

- [ ] Port all markdown content from Hugo content/ to Astro src/content/
- [ ] Port all images from static/ to public/
- [ ] Replace Hugo shortcodes (tabs, youtube, cards) with Astro components
- [ ] Preserve all URLs (or add redirects)
- [ ] Update GitHub Actions workflow for Astro build
- [ ] Test dark/light mode toggle
- [ ] Test all internal links
- [ ] Test YouTube embeds
- [ ] Test responsive layout (mobile sidebar → hamburger or collapse)
- [ ] Verify GitHub Pages deployment
