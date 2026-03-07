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

## Platform / Framework Gaps

Features needed to make Linkable a fully-fledged static site generation framework.

| #  | Feature                          | Status | Description                                                                                                                                                                                                  |
| -- | -------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 22 | **Full SSR / Pre-rendering**     | ✅      | Build-time pre-rendering via Puppeteer. The `prerenderBuildPlugin` launches headless Chrome, navigates each route, waits for the Vue app to signal readiness, and writes fully rendered HTML to `dist/`.      |
| 23 | **File-based Routing**           | ⬜      | Routes are declared in layout manifests. Add optional filesystem-convention routing (e.g. `pages/about.vue` → `/about`) for user layouts.                                                                   |
| 24 | **Middleware / Per-request Logic**| ⬜      | No per-request server middleware. Supabase edge functions cover API needs but there's no route-level middleware for auth guards, redirects, or headers.                                                       |
| 25 | **ISR / Incremental Rebuilds**   | ⬜      | Full rebuild required on every deploy. Investigate incremental static regeneration for large sites with many layout routes.                                                                                   |
| 26 | **Image Optimization**           | ⬜      | No responsive `srcset`, on-demand resizing, or CDN integration. Add automatic image sizing, lazy loading with blur placeholders, and WebP/AVIF `srcset` generation at build time.                            |

## Commerce & SaaS Platform

Features needed to make Linkable a full-stack SaaS / e-commerce starter (à la Laravel Spark).

### Authentication & User Management

| #  | Feature                           | Status | Description                                                                                                                                                                                                  |
| -- | --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 27 | **Supabase Auth Integration**     | ⬜      | Email/password, magic link, and OAuth (Google, GitHub, etc.) sign-up and login. Auth state via `useAuth()` composable. Session stored in Supabase with JWT refresh.                                           |
| 28 | **User Profile & Account Page**   | ⬜      | Account settings page: name, email, avatar, password change, connected OAuth providers, and account deletion. Accessible via layout route or standalone page.                                                |
| 29 | **Auth UI Components**            | ⬜      | Login, register, forgot-password, and reset-password forms as reusable Vue components. Slot-based customization so layouts can restyle them.                                                                 |
| 30 | **Route Guards & Auth Middleware**| ⬜      | Vue Router `beforeEach` guard system. Layout routes can declare `meta.requiresAuth`, `meta.requiresGuest`, or `meta.requiresPermission` for automatic redirect/gating.                                      |
| 31 | **Role & Permission System**      | ⬜      | Permissions table in Supabase. `usePermissions()` composable for front-end checks (`can('access:pro-features')`). Supabase RLS policies for backend enforcement. Roles are optional groupings of permissions.|

### Payments & Subscriptions (Stripe)

| #  | Feature                           | Status | Description                                                                                                                                                                                                  |
| -- | --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 32 | **Stripe Integration Core**       | ⬜      | Supabase edge function to create Checkout Sessions, manage webhooks, and sync subscription state. Stripe Customer linked to Supabase user via `stripe_customer_id` column.                                   |
| 33 | **Product & Price Management**    | ⬜      | Products and prices defined in Stripe; synced to a `products` table via webhook. CMS UI to browse and assign products. Supports one-time purchases and recurring subscriptions.                              |
| 34 | **Checkout Flow**                 | ⬜      | `useCheckout()` composable: redirects to Stripe Checkout (hosted) or renders embedded Stripe Elements. Handles success/cancel callbacks and updates local subscription state.                                |
| 35 | **Subscription Lifecycle**        | ⬜      | Webhook handlers for `customer.subscription.created/updated/deleted`, `invoice.paid/failed`. Supabase `subscriptions` table with status, current period, cancel-at. Auto-grant/revoke permissions on change. |
| 36 | **Customer Portal**               | ⬜      | Link to Stripe Customer Portal for self-service plan changes, payment method updates, invoice history, and cancellation. One-click redirect via edge function.                                               |
| 37 | **One-time Purchases / Digital Products** | ⬜ | Sell downloadable files (PDFs, templates, presets) via Stripe Checkout. `purchases` table tracks completed payments. Download links gated by purchase record.                                                |
| 38 | **Usage-based / Metered Billing** | ⬜      | Report usage to Stripe via edge function. Supports credit-based or metered subscription models for API access, AI features, etc.                                                                             |

### Permissions & Entitlements

| #  | Feature                           | Status | Description                                                                                                                                                                                                  |
| -- | --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 39 | **Entitlement Engine**            | ⬜      | Mapping layer: Stripe products/prices → permissions. When a subscription activates or a purchase completes, the corresponding permissions are granted. Revoked on cancellation/expiry.                       |
| 40 | **Frontend Permission Gates**     | ⬜      | `<PermissionGate permission="access:pro">` component and `v-if="can('access:pro')"` directive. Shows upgrade prompt or fallback slot for unauthorized users.                                                |
| 41 | **Backend Permission Enforcement**| ⬜      | Supabase RLS policies and edge function middleware that verify permissions from the `user_permissions` table. No client-side-only gating on sensitive data.                                                  |
| 42 | **Plan / Tier Display**           | ⬜      | Pricing table component (free / pro / enterprise). Highlights current plan. CMS-editable plan names, features, and prices. Pulls live pricing from Stripe.                                                   |

### Database & Infrastructure

| #  | Feature                           | Status | Description                                                                                                                                                                                                  |
| -- | --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 43 | **Auth & Commerce Schema**        | ⬜      | Supabase migrations for: `profiles`, `subscriptions`, `purchases`, `products`, `permissions`, `user_permissions`, `role_permissions`. All behind RLS.                                                        |
| 44 | **Webhook Security**              | ⬜      | Stripe webhook signature verification in edge functions. Idempotency keys to prevent duplicate processing. Event log table for debugging.                                                                    |
| 45 | **Admin Dashboard**               | ⬜      | CMS tab or standalone route for site owners: subscriber list, revenue overview, recent purchases, permission assignments. Read from Supabase, not Stripe API, for speed.                                     |
| 46 | **Email Transactional Templates** | ⬜      | Welcome, purchase confirmation, subscription renewal, payment failed, and cancellation emails. Sent via Supabase edge function + Resend/Postmark. Templates editable in CMS.                                |

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
- **Pre-rendering** — Build-time Puppeteer pre-rendering of `/` and layout routes with `prerender` set, producing fully rendered static HTML for SEO and fast initial paint