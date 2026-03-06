# Planned Features

Open-source link-in-bio alternative — feature roadmap and implementation status.

## Legend

| Status | Meaning     |
| ------ | ----------- |
| ⬜      | Not started |
| 🟡     | In progress |
| ✅      | Complete    |

---

## High Impact

| # | Feature                             | Status | Description                                                                                                                                                                                                                                |
| - | ----------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 | **Analytics & Click Tracking**      | ✅      | Built-in click counts per link, page view tracking, and a simple analytics dashboard in the CMS. Currently only external script injection is supported.                                                                                    |
| 2 | **Drag-and-Drop Reordering**        | ✅      | Drag-to-reorder for links, gallery items, social icons, embeds, and resume sections via `vuedraggable`.                                                                                                                                    |
| 3 | **Font Customization**              | ⬜      | Font family and weight picker in the theme settings. Google Fonts selector with a CSS variable for easy theming.                                                                                                                           |
| 4 | **Animated / Gradient Backgrounds** | ⬜      | CSS gradient presets, animated gradients, and background effects beyond solid colors and glass morphism.                                                                                                                                   |
| 5 | **QR Code Generation**              | ⬜      | One-click QR code for the page URL, downloadable from the CMS. Client-side generation via a library like `qrcode`.                                                                                                                         |
| 6 | **Link Scheduling**                 | ✅      | Time-based visibility for links, gallery items, embeds, and blog posts via `publishDate` / `expirationDate` fields. Client-side filtering by default, with `VITE_SCHEDULE_EXCLUDE_BUILD` env var to strip scheduled content at build time. |
| 7 | **Priority / Spotlight Links**      | ⬜      | Visually highlight or pin featured links with a larger card, accent color, or animation to draw attention.                                                                                                                                 |

## Medium Impact

| #  | Feature                           | Status | Description                                                                                                                       |
| -- | --------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 8  | **Email / Newsletter Collection** | ✅      | Built-in email signup block with optional integration for Mailchimp, ConvertKit, Buttondown, or local CSV export.                 |
| 9  | **Contact Form**                  | ⬜      | Simple name/email/message form that forwards submissions to the site owner without exposing their email address.                  |
| 10 | **Auto-Favicon for Links**        | ⬜      | Automatically fetch the favicon or OG image from a link's target URL as a default thumbnail when no custom image is set.          |
| 11 | **Multiple Layout Options**       | ⬜      | Alternative layouts for links and profile: grid vs. list vs. carousel, centered vs. left-aligned vs. minimal profile card styles. |
| 12 | **Custom CSS Override**           | ⬜      | Dedicated custom CSS field in the CMS (separate from the analytics script fields) for power-user styling.                         |
| 13 | **Sensitive Content / Age Gate**  | ⬜      | Optional content warning interstitial before displaying the page, required for certain creator content.                           |

## Nice-to-Have / Differentiators

| #  | Feature                         | Status | Description                                                                                   |
| -- | ------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| 14 | **Music Link Cards**            | ⬜      | Special card type that shows album art and links to Spotify, Apple Music, YouTube Music, etc. |
| 15 | **Donation / Tip Jar**          | ⬜      | Integration with Ko-fi, Buy Me a Coffee, or Stripe for accepting tips and donations.          |
| 16 | **Digital Product Sales**       | ⬜      | Sell downloadable files (PDFs, presets, templates) directly from the page.                    |
| 17 | **Countdown Timer Widget**      | ⬜      | Event countdown block for launches, streams, or deadlines.                                    |
| 18 | **Testimonials / Social Proof** | ⬜      | Display quotes, reviews, or endorsements in a dedicated section.                              |
| 19 | **Map / Location Block**        | ⬜      | Embedded map for physical businesses or event venues.                                         |
| 20 | **Multi-language / i18n**       | ⬜      | Interface and content translation support.                                                    |
| 21 | **Import from Linktree**        | ⬜      | Migration tool to pull existing links and profile data from Linktree export.                  |

---

## Already Implemented

Core features that are complete and shipped:

- **Profile & Bio** — Display name, tagline, avatar, banner image
- **Link Management** — Custom links with title, subtitle, URL, thumbnail, tags, enable/disable
- **Social Links** — Icon picker (400+ Lucide icons), custom labels, enable/disable
- **Gallery** — Masonry grid, image + video (YouTube, Vimeo, MP4), lightbox, tags, search
- **Blog** — Markdown editor (Tiptap), syntax highlighting, cover images, tags, RSS feed
- **Resume / CV** — Bio, employment, education, skills, achievements sections
- **Custom Embeds** — Arbitrary HTML/iframe injection with custom tab labels and icons
- **Theming** — 20+ color variables, light/dark/custom modes, glass morphism, radius control
- **CMS** — Tabbed editor dialog, password protection, change detection, keyboard shortcut
- **Search & Filtering** — Per-section search bars with multi-select tag filters
- **Tab Navigation** — Hash-based routing, customizable icons and labels, default tab setting
- **GitHub Integration** — Sync content to a private repo, commit UI, import/export
- **PWA** — Manifest, standalone mode, installable
- **SEO** — Favicon, OG image, meta tags
- **Schema Migrations** — Auto-upgrade data model across versions (currently v19)
- **Image Uploads** — Drag-drop upload with AVIF/WebP/PNG/JPG support
- **Custom Scripts** — Head and body-end script injection for analytics
- **Content Scheduling** — Publish date and expiration date for links, gallery items, embeds, and blog posts; optional build-time exclusion via `VITE_SCHEDULE_EXCLUDE_BUILD`
- **Drag-and-Drop Reordering** — Reorder links, embeds, socials, gallery items, and resume sections via vuedraggable
- **Tab Icons** — Customizable Lucide icons for each default section tab