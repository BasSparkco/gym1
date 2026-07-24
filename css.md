# CSS Conventions

Reference doc for recurring styling requests. When asked to "style this page
according to css.md" (or similar), apply the convention(s) below to that
page's cards/sections.

## Left-side accent border on cards

Every major card/section/div on a page gets a 4px accent border on its
leading edge, plus a distinct color per card so the page reads as organized
sections rather than one undifferentiated block.

**Classes to add** (on top of whatever the card already has):

```
border-s-4 border-s-{token}
```

Example, extending an existing card:

```tsx
// before
<section className="rounded-[18px] border border-line bg-surface px-7 py-6">

// after
<section className="rounded-[18px] border border-line border-s-4 border-s-brand bg-surface px-7 py-6">
```

**Use `border-s-4`, never `border-l-4`.** This app is RTL-aware (Arabic /
Hebrew are first-class languages, not an afterthought — see the rest of the
codebase's use of `ps-`/`pe-`/`ms-`/`me-`/`text-start` everywhere). `border-s`
is a logical property: it renders on the left in LTR and automatically flips
to the right in RTL, matching how every other edge-aware style in this app
already behaves. A literal `border-left` would stay stuck on the physical
left and look broken/backwards once the layout mirrors for Arabic.

**Color palette** — pick from the existing design tokens
(`apps/web/src/app/globals.css`), never a raw hex value:

| Token | Hex | Feel |
|---|---|---|
| `border-s-brand` | `#2C5A4E` | pine green — primary/neutral, anchor sections |
| `border-s-brand-deeper` | `#123A31` | deep teal — grounded, financial/serious |
| `border-s-accent` | `#C9F24B` | bright lime — pops, use sparingly for a highlight/dark-bg card |
| `border-s-accent-strong` | `#7CAF23` | olive green — positive/active state |
| `border-s-danger` | `#B23B3E` | red — urgency/safety |
| `border-s-muted` | `#5C6B64` | gray-green — subtle/container, least attention-grabbing |

Plus Tailwind's default palette for anything not covered above (already used
elsewhere in the app for status badges — `frozen` is blue, `pending` is
amber):

| Class | Feel |
|---|---|
| `border-s-blue-500` | informational/operational |
| `border-s-amber-500` | warning/expiring/pending |

**Choosing colors per page:**
- Give each card its own color — don't reuse the same one for every card on
  a page (defeats the point of visually separating sections).
- It's fine — good, even — to pair two cards that are thematically related
  with the *same* color (e.g. a stat card and the detail card below it that
  expands on the same metric).
- Prefer colors that already carry that meaning elsewhere in the app (e.g.
  danger=red is already "urgent" via the `pillTone` status badges; amber is
  already "pending/expiring"). Reuse that meaning rather than inventing a new
  one.
- Cards with a dark background (e.g. `bg-brand-strong`) read best with
  `border-s-accent` (bright lime) since it's the only token with enough
  contrast to pop against a dark fill.

## Reference implementations

Two pages already use this convention — read their diffs/current code before
applying it elsewhere, since they show the pattern applied to real (not
hypothetical) cards:

- **Member profile** — `apps/web/src/components/members/member-profile-view.tsx`
  (shared by both `/app/members/[memberId]` and the inline expand-a-row view
  on `/app/members`): Identity=`brand`, Emergency Contact=`danger`,
  Memberships=`accent-strong`, Lockers=`blue-500`, Payments=`brand-deeper`.
- **Dashboard** — `apps/web/src/app/app/dashboard/page.tsx`: Hero=`brand`,
  stat cards (`active-memberships`=`accent-strong`,
  `expiring-memberships`=`amber-500`, `today-check-ins`=`blue-500`,
  `payments-logged`=`brand-deeper`), Latest check-ins=`blue-500` (pairs with
  today's check-ins), Memberships expiring soon=`amber-500` (pairs with
  expiring-this-week), Branches at a glance=`brand`, Branch Overview=`muted`,
  Operations Guide=`accent` (dark background).

## Applying to a new page

1. Read the page and list its top-level card/section divs.
2. Assign each one a token from the palette above — distinct per card,
   paired where thematically related, reusing existing color-meaning where
   it exists.
3. Add `border-s-4 border-s-{token}` to each card's className (alongside
   its existing `border border-line`, not replacing it).
4. Verify in the browser in **both** an LTR language (English) and an RTL
   language (Arabic) — confirm the border renders on the correct/mirrored
   edge in each before calling it done.
5. `tsc --noEmit` + `next build` clean, then deploy per the usual flow
   (`docker compose -p gym -f docker-compose.prod.yml build web` +
   `up -d --no-deps web`, backup first via `scripts/backup.sh`).
