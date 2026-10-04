# LanceBuddy — UI Specification (UI.md)

Goal: make the LanceBuddy website look, move and behave **exactly** like the two reference files:

| Reference file | Becomes |
|---|---|
| `LanceBuddy__immersive_landing__v2_.html` | Marketing / landing page (`/`) |
| `lancebuddy-scout2.html` | Scout workspace / app page (`/scout` or the existing app URL) |

**Two hard requirements apply to everything below:**
1. **Fully responsive for smartphones** (mobile-first quality, not just "shrinks"). See section 12.
2. **The frontend is built with React.js.** The reference HTML files are the visual and behavioural source of truth; React is how they are implemented. See section 13.

Both pages share one design system, one globe, and one theme switch. Anything not stated here: copy it verbatim from the reference files. **Do not restyle, rename tokens, or "improve" values.** Keep both reference files in the repo (e.g. `/reference/`) as the source of truth.

---

## 1. Design identity

Monochrome, editorial, cinematic. Pure black and white only, no accent color. Huge tight-tracked headlines, tiny mono labels, hairline borders, glass (blurred translucent) surfaces, and a full-screen 3D dotted globe fixed behind all content that moves between sections as the user scrolls.

Rules that define the look:
- **Only 2 colors + 2 greys**: ink and background, plus `--mute` (secondary text) and `--line` (borders). Everything else is derived with `color-mix(in srgb, var(--ink|--bg) N%, transparent)`.
- **Pill shapes** (`border-radius:99px`) for buttons, chips, pills, pins, toast. **Rounded cards** at 24px (cards, plans), 20px (stat tiles), 18px (HUD), 16px (columns, empty state), 12px (inputs, tickets).
- **Glass**: translucent `--bg` + `backdrop-filter: blur(8–16px)` on every floating surface.
- **Hairlines**: 1px solid `--line`; hover/active upgrades the border to `--ink`.
- **No shadows, no gradients** except the cursor spotlight and the no-WebGL fallback glow.
- **No images or illustrations.** Visual interest comes from type scale, the globe, the huge outlined section numbers, and motion.

---

## 2. Tokens

```css
:root{--bg:#fff;--ink:#000;--mute:#666;--line:#e4e4e4;--on:#fff}      /* light */
dark: --bg:#000; --ink:#fff; --mute:#8f8f8f; --line:#262626; --on:#000
```

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#fff` | `#000` | page + glass base |
| `--ink` | `#000` | `#fff` | text, filled buttons, active borders, globe color |
| `--mute` | `#666` | `#8f8f8f` | secondary text, labels |
| `--line` | `#e4e4e4` | `#262626` | all borders, outlined section numbers |
| `--on` | `#fff` | `#000` | text on filled `--ink` surfaces |

Theme logic: follows `prefers-color-scheme` by default; the header toggle sets `data-theme="light|dark"` on `<html>` and persists to `localStorage` key **`lb-theme`**. The theme init script must sit in `<head>` (prevents flash). The globe re-reads `--ink` every 30 frames so it recolors on toggle.

```js
(function(){var r=document.documentElement,t=null;try{t=localStorage.getItem('lb-theme')}catch(e){}
if(t==='dark'||t==='light')r.setAttribute('data-theme',t);
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('#tg');if(!b)return;
var c=r.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'),n=c==='dark'?'light':'dark';
r.setAttribute('data-theme',n);try{localStorage.setItem('lb-theme',n)}catch(x){}})})()
```

## 3. Typography

- **Fonts** (Google Fonts, exactly this link):
  `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap`
- Body: `Geist`, 400, `1.05rem/1.6`, antialiased.
- Headings `h1–h4`: weight 700, `letter-spacing:-.045em`, `line-height:.98`.
- Mono labels (`Geist Mono`, uppercase, wide tracking) for every eyebrow/label/meta element.

| Role | Spec |
|---|---|
| Landing H1 | `clamp(3rem,10.5vw,9rem)`, line-height `.93` |
| Scout H1 (`.h1s`) | `clamp(3rem,8vw,6.5rem)`, line-height `.95` |
| Section H2 | `clamp(3.4rem,9vw,7.5rem)` |
| Final CTA H2 (`.fin`) | `clamp(3rem,9vw,8rem)`, `max-width:13ch` |
| Pricing H2 | inline `max-width:14ch`, centered |
| Eyebrow `.k` | mono 500 `.75rem`, uppercase, `.09em`, `--mute`, mb `1.2rem` |
| Description `.d` | `--mute`, margin `1.4rem 0 1.8rem`, max-width `30rem` |
| Card title `h3` | `2rem` |
| Price | 700 `3.6rem`, `-.05em`, line-height 1 |
| Stat number | 700 `3.2rem`, `-.05em` |
| dt / col h4 / pin / rail | mono 500 `.7–.72rem`, uppercase, `.07–.08em` |

Copy style: short headings ending with a period (`Find.` `Verify.` `Write.` `Track.` `Notes.` `Questions.`), sentence-case body, no exclamation marks, no emoji. Currency is ₹.

## 4. Layout system

- Every section is `.sc`: `position:relative; min-height:100svh; display:flex; align-items:center; padding:6.5rem clamp(1.25rem,6vw,6rem); z-index:1`.
- Alignment modifiers: default = content left; `.sc.r` = content pushed right (`justify-content:flex-end`, text left); `.sc.c` = centered.
- Content wrapper `.in`: `max-width:34rem` (`.in.wide` = `42rem`, `width:100%`; hero `.in` = `62rem`).
- **Zig-zag**: content alternates left / right so the globe sits on the opposite side (globe x offsets in section 8).
- Fixed layers (back to front): `.glow` spotlight (z0) → `#gl` canvas (z0) → sections (z1) → `#pins` (z3) → `.rail` + `header` (z20) → `.prog` (z30) → `#hud` (z40) → `#toast` (z45).
- Huge outlined section number: `.sc[data-n]::after` shows `data-n` (`01`, `02`…) as transparent text with `-webkit-text-stroke:1px var(--line)`, `clamp(12rem,36vw,32rem)`, bottom-right (bottom-left on `.r` sections), z-index -1, with scroll-driven parallax (`translateY(14vh → -14vh)`).
- Breakpoint: **899px**. Below it: rail hidden, sections top-aligned, plans/dl stack to 1 column, pins and `.hd` hints hidden, outlined number shrinks to `48vw`, scout `.pill` hidden.

## 5. Global chrome (identical on both pages)

1. **Progress bar** `.prog`: fixed top, 2px `--ink`, `scaleX(var(--sp))` driven by scroll.
2. **Header** (fixed, transparent, no border): logo left; right cluster `.hr`.
   - Logo: filled `--ink` dot (`.65em`) + "LanceBuddy", 700, `1.1rem`, `-.03em`.
   - Landing right cluster: **Start free** `.btn` + theme toggle.
   - Scout right cluster: `.pill` ("`N scouts left`") + theme toggle. Logo links to landing.
   - Theme toggle `#tg`: 2.6rem circle, hairline border, glass, sun/moon SVG swap.
3. **Section rail** `.rail`: fixed left, vertically centered column of dots + mono labels. Only the active label is visible; active dot fills and scales 1.4.
   - Landing: Start · Find · Verify · Write · Track · Pricing · Go
   - Scout: Scout · Results · Notes · Pricing · Help
4. **Cursor spotlight** `.glow`: 520px radial `--ink` 7% following the pointer (`--mx`,`--my`).
5. **Magnetic buttons**: on pointer move over a `.btn`, translate it `(dx*.2, dy*.3)` toward the cursor; reset others. Disabled when reduced motion.
6. **City pins** `#pins`: mono pill labels that track each city marker on the globe (desktop only, only when the active section is the one that shows the globe cities, fade by facing angle).

## 6. Components (class → behavior)

| Component | Class | Notes |
|---|---|---|
| Button | `.btn` | Filled ink pill, `.8rem 1.5rem`, 600. Hover lift `-2px`, active `scale(.97)`. Arrow icon after primary CTAs. |
| Ghost button | `.btn.ghost` | Glass bg, `--line` border → `--ink` on hover. |
| Chip | `.chip` | Pill, `--mute` text; hover → ink border/text; `.on` = filled ink. Used for city, industry, tags, status, actions. |
| Card | `.card` | 24px radius, glass 78%, blur 16; hover lifts `-4px` and border → ink. |
| Spec list | `dl/dt/dd` | 2-col grid, mono icon labels, `dd` weight 500; `.u` underlines the opportunity. |
| Pitch quote | `.pitch` | 2px ink left border; typewriter reveal on scroll (18ms/char, blinking caret). |
| Kanban | `.kb .col .tk` | 3 dashed columns (New / Contacted / Converted); click a ticket → moves to next column with `pop` animation. |
| Plans | `.plans .plan` | 2-col, gap `2.5rem`, max `60rem`; `.pro` has ink border. Check icons via CSS mask. `li.no` is muted. |
| Form | `form label`, `input` | Mono labels; inputs 12px radius, glass, focus = ink border (no outline). |
| Result row | `.lr` | Top hairline, slide-in from right, `b` name + muted meta line + status chip (`.st.s0/.s1/.s2`). |
| Row actions | `.ra .chip` | Pitch / Save note / Call / WhatsApp. Pitch toggles `.pt` panel with Copy pitch. |
| Stats | `.stats3` | 3 glass tiles with big numbers that `bump` on change. |
| Notes | `.nts li` | Editable `input` + Remove chip. `.empty` dashed placeholder when none. |
| FAQ | `details/summary` | Hairline top borders; `+` / `–` marker. |
| HUD | `#hud` | Bottom-center glass panel with 2px progress bar, slides up while scanning. |
| Toast | `#toast` | Ink pill, top center, slides down from above. |

## 7. Motion

| What | Spec |
|---|---|
| Hero entrance | children fade/slide up 34px, 1s, `cubic-bezier(.2,.8,.2,1)`, staggered `.12s` |
| Scroll reveal `.rv` | `rv`: from `translateY(50px) blur(8px)`, `animation-timeline:view()`, range `entry 0% → entry 60%` (inside `@supports`) |
| Scroll cue | "Scroll" mono label + 1px line pulsing `scaleY(.3)` 1.8s |
| Section numbers | parallax `dr` via `view()` timeline |
| Chip/card/btn | `.2–.3s` transitions on border, transform, color |
| Typewriter | 18ms per character, caret blink `steps(1)` |
| Reduced motion | `*{animation:none!important;transition:none!important}` and globe stops auto-rotation/intro |

## 8. The globe (the signature element)

Three.js **r128** from `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`. One fixed full-screen transparent canvas `#gl`, pointer-events none. Copy the globe `<script>` verbatim from the reference files; parameters for reference:

- **Point-sphere** of `N=2600` Fibonacci points, radius 2, point size `.032`, opacity from per-section table. Intro: points fly in from a random cloud over `3000ms` (ease-out-quart), skipped under reduced motion.
- Layers: 700 background stars (`.09`, op `.45`), radial glow sprite (op `.16`), wireframe icosahedron (r `1.97`, op `.07`), 8 city markers (size `.13`), selected-city pulsing ring marker, tilted orbit ring (r `2.9`, tilt `1.25`) with orbiting satellite, bezier **arcs** from selected city to every other city with traveling packet dots, click **shockwave** ripple + expanding ring.
- Color = `--ink` (all materials repainted on theme change).
- Interaction: mouse parallax on camera/wrapper, drag to spin (rx clamped ±1.1, inertia `.95`), click empty space = shockwave, scroll velocity adds spin.
- Cities (label, lat, lon): Mumbai 19.08, 72.88 · Delhi 28.61, 77.21 · Bangalore 12.97, 77.59 · Chennai 13.08, 80.27 · Kolkata 22.57, 88.36 · Hyderabad 17.39, 78.49 · Pune 18.52, 73.86 · Varanasi 25.32, 82.97.
- Fallback if WebGL/Three fails: `body.nogl` adds a soft radial ink glow; page remains fully usable.
- Mobile: globe centered at `y=.9`, smaller scale, camera pulled back `+1.5` (see section 12).

Per-section globe pose (index = section order):

| Page | `XS` (x offset) | `SC` (scale) | `OP` (opacity) | `CZ` (camera z) |
|---|---|---|---|---|
| Landing | `[0,2.7,-2.7,2.7,-2.7,0,0]` | `[1.05,1,1,1.05,1,.7,1.5]` | `[.85,.85,.85,.85,.85,.25,.6]` | `[8,7.4,5.8,7,7.4,9.5,6.4]` |
| Scout | `[2.7,-2.7,2.7,0,-2.7]` | `[1.05,1,1.05,.7,1]` | `[.9,.65,.85,.25,.7]` | `[7.2,7.6,6.8,9.5,7.4]` |

Landing: Find section (`#s1`) snaps the globe to the selected city and shows pins. Scout: sections 0–1 snap to the selected city; pins show on section 0; each lead found drops a marker dot near the city (max 12) and fires a shockwave; during a scan the camera pushes in `1.2`, extra spin, and periodic shockwaves.

## 9. Landing page — section map

| # | id | Align | Content |
|---|---|---|---|
| 0 | `s0` hero | center | Eyebrow "Free local lead finder for India" · H1 "Direct local client discovery." · desc "Verified businesses, real phone numbers and Maps listings. Your next client, found in seconds." · buttons **Start free scouting →** + ghost **Explore** · scroll cue |
| 1 | `s1` data-n 01 | left | "01 / Find" · **Find.** · city chips (Mumbai default `.on`) · mono output "Sample: N dental clinics in {city}" · hint "Drag the globe to spin it. Click empty space for a shockwave." |
| 2 | `s2` data-n 02 | right | "02 / Verify" · **Verify.** · `.card` "Interior and architecture · Bengaluru" / "Aura Spatial Architecture" with Rating 4.9 (84 reviews), Phone, Source "Google Maps, verified", Opportunity "No website found" (underlined) |
| 3 | `s3` data-n 03 | left | "03 / Write" · **Write.** · typewriter pitch · chips: Portfolio website (on), Local SEO, Lead form |
| 4 | `s4` data-n 04 | right | "04 / Track" · **Track.** · 3-column kanban with sample leads · hint "Sample leads, to show how the pipeline works." |
| 5 | `s5` | center | "05 / Pricing" · "Free to start. ₹179 a year to grow." · Free plan ₹0 for life (ghost CTA "Get started free") · Pro ₹179 per year (primary CTA "Upgrade to Pro") |
| 6 | `s6` `.fin` | center | "Your next client is already on the map." · CTA + absolute footer "© 2026 LanceBuddy · Built for independent professionals · Maintained by Shaurya Pratap Singh" |

All CTAs link to `https://lancebuddy.skituspanda.workers.dev/` (swap to the production app URL if it differs).

## 10. Scout page — section map

| # | id | Align | Content |
|---|---|---|---|
| 0 | `s0` data-n 01 | left | "Workspace / Scout" · `h1.h1s` **Scout your city.** · desc · form: optional email (`#em`), Industry chips (Dental clinic, Interior designer, Travel agency, Restaurant, Gym, Salon), City chips, primary **Scout verified leads →** · mono "N free scouts left this month" |
| 1 | `s1` data-n 02 | right (`.wide`) | "Results" · `h2#rt` · desc `#rd` · `ul.res` of lead rows · ghost **Export CSV** |
| 2 | `s2` data-n 03 | left (`.wide`) | "Pipeline and notes" · **Notes.** · `.stats3` (New / Contacted / Converted) · `ul.nts` or `.empty` "No notes yet. Use "Save note" on any lead and it appears here." |
| 3 | `s3` data-n 04 | center | Same pricing block as landing; free plan button reads **Current plan** |
| 4 | `s4` data-n 05 | right (`.wide`) | "Help" · **Questions.** · 3 FAQs (card needed? / where data comes from / where data stored) · contact line (`jakadwangdu@outlook.com`, Instagram `@official_jakadwangdu`) · static footer "© 2026 LanceBuddy · Maintained by Shaurya Pratap Singh" |

Scout behaviors to preserve exactly:
- Free quota starts at 5; header pill and form text update (`N scouts left`, singular handled). At 0 → toast "No free scouts left this month. Upgrade for unlimited scouting." and smooth-scroll to pricing.
- Submitting runs an ~8-lead scan: rows appear every `520ms`; HUD slides up with rotating messages (Scanning Google Maps… / Reading JustDial listings… / Checking IndiaMART… / Verifying phone numbers…) every `900ms`; title becomes "Scanning {city}…" then "N {industry} leads."; auto-scrolls to results after `900ms`; HUD hides after `2800ms`.
- Lead row: name, "{city} · {source} verified · {rating}★ ({reviews}) · {phone}", status chip cycling New → Contacted → Converted (updates counters with bump), actions Pitch / Save note / Call / WhatsApp. Pitch text: "Hi Team {first word}, I noticed {name} has a {rating}★ rating on {source} in {city}, but {opportunity}. I drafted a quick preview if you would like to see it."
- Toasts: "Note saved", "Pitch copied", "Select the text to copy it", "CSV export is part of Pro", "This is a sample lead. Call and WhatsApp work on real results." (replace the sample-lead toast with real actions once wired to live data).
- Changing the city clears globe lead dots.

## 11. Source CSS — shared design system (verbatim from both files)

Paste this as the single global stylesheet. It is identical in both reference files.

```css
:root{--bg:#fff;--ink:#000;--mute:#666;--line:#e4e4e4;--on:#fff;box-sizing:border-box}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#000;--ink:#fff;--mute:#8f8f8f;--line:#262626;--on:#000}}
:root[data-theme="dark"]{--bg:#000;--ink:#fff;--mute:#8f8f8f;--line:#262626;--on:#000}
:root[data-theme="light"]{--bg:#fff;--ink:#000;--mute:#666;--line:#e4e4e4;--on:#fff}
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:400 1.05rem/1.6 Geist,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
button,input{font-family:inherit}
a{color:inherit}
h1,h2,h3,h4{margin:0;font-weight:700;letter-spacing:-.045em;line-height:.98}
:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
#gl{position:fixed;inset:0;width:100%;height:100%;display:block;z-index:0;pointer-events:none}
body.nogl::before{content:"";position:fixed;inset:0;z-index:0;background:radial-gradient(45% 45% at 50% 45%,color-mix(in srgb,var(--ink) 9%,transparent),transparent 70%)}
.prog{position:fixed;top:0;left:0;right:0;height:2px;background:var(--ink);transform-origin:0 50%;transform:scaleX(var(--sp,0));z-index:30}
header{position:fixed;top:0;left:0;right:0;z-index:20;display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:max(1rem,env(safe-area-inset-top)) clamp(1rem,4vw,3rem) 1rem}
.logo{display:flex;align-items:center;gap:.55rem;font-weight:700;font-size:1.1rem;letter-spacing:-.03em;text-decoration:none}
.logo i{width:.65em;height:.65em;border-radius:50%;background:var(--ink)}
.hr{display:flex;align-items:center;gap:.6rem}
#tg{width:2.6rem;height:2.6rem;border-radius:50%;border:1px solid var(--line);background:color-mix(in srgb,var(--bg) 70%,transparent);backdrop-filter:blur(12px);color:var(--ink);display:grid;place-items:center;cursor:pointer}
#tg:hover{border-color:var(--ink)}
#tg .sun{display:none}
:root[data-theme="dark"] #tg .sun{display:block}:root[data-theme="dark"] #tg .moon{display:none}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]) #tg .sun{display:block}:root:not([data-theme="light"]) #tg .moon{display:none}}
.btn{display:inline-flex;align-items:center;gap:.55rem;background:var(--ink);color:var(--on);border:1px solid var(--ink);border-radius:99px;padding:.8rem 1.5rem;font-weight:600;font-size:1rem;text-decoration:none;cursor:pointer;transition:transform .2s,background .2s,color .2s}
.btn:hover{transform:translateY(-2px)}.btn:active{transform:scale(.97)}
.btn.ghost{background:color-mix(in srgb,var(--bg) 60%,transparent);color:var(--ink);border-color:var(--line);backdrop-filter:blur(10px)}.btn.ghost:hover{border-color:var(--ink)}
.i{width:1.15em;height:1.15em;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;flex:none}
.rail{position:fixed;left:clamp(.8rem,2vw,1.6rem);top:50%;transform:translateY(-50%);z-index:20;display:flex;flex-direction:column;gap:1.1rem}
.rail a{display:flex;align-items:center;gap:.7rem;text-decoration:none;color:var(--mute);font:500 .7rem "Geist Mono",ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em}
.rail i{width:.55rem;height:.55rem;border-radius:50%;border:1.5px solid currentColor;transition:all .3s}
.rail span{opacity:0;transform:translateX(-6px);transition:all .3s}
.rail a.on{color:var(--ink)}.rail a.on i{background:var(--ink);transform:scale(1.4)}.rail a.on span{opacity:1;transform:none}
.sc{position:relative;z-index:1;min-height:100svh;display:flex;align-items:center;padding:6.5rem clamp(1.25rem,6vw,6rem)}
.sc.r{justify-content:flex-end}.sc.c{justify-content:center;text-align:center}
.in{max-width:34rem}.sc.r .in{text-align:left}
.k{font:500 .75rem "Geist Mono",ui-monospace,monospace;text-transform:uppercase;letter-spacing:.09em;color:var(--mute);margin:0 0 1.2rem}
.sc h2{font-size:clamp(3.4rem,9vw,7.5rem)}
.sc p.d{color:var(--mute);margin:1.4rem 0 1.8rem;max-width:30rem}
h1{font-size:clamp(3rem,10.5vw,9rem);line-height:.93}
.hero .in{max-width:62rem}.hero p.d{margin-left:auto;margin-right:auto}
.row{display:flex;gap:.8rem;flex-wrap:wrap}.c .row{justify-content:center}
.cue{position:absolute;bottom:1.6rem;left:50%;transform:translateX(-50%);font:500 .7rem "Geist Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--mute);display:flex;flex-direction:column;align-items:center;gap:.5rem}
.cue::after{content:"";width:1px;height:2.2rem;background:var(--mute);transform-origin:top;animation:cue 1.8s ease-in-out infinite}
@keyframes cue{50%{transform:scaleY(.3)}}
.hero .in>*{animation:up 1s both cubic-bezier(.2,.8,.2,1)}.hero .in>*:nth-child(2){animation-delay:.12s}.hero .in>*:nth-child(3){animation-delay:.24s}.hero .in>*:nth-child(4){animation-delay:.36s}
@keyframes up{from{opacity:0;transform:translateY(34px)}}
@keyframes rv{from{opacity:0;transform:translateY(50px);filter:blur(8px)}}
@supports (animation-timeline:view()){.rv{animation:rv linear both;animation-timeline:view();animation-range:entry 0% entry 60%}}
.chips{display:flex;flex-wrap:wrap;gap:.5rem;margin:1.4rem 0 1rem}
.chip{border:1px solid var(--line);background:color-mix(in srgb,var(--bg) 60%,transparent);backdrop-filter:blur(8px);color:var(--mute);border-radius:99px;padding:.45rem 1.05rem;font-size:.95rem;cursor:pointer;transition:all .2s}
.chip:hover{border-color:var(--ink);color:var(--ink)}.chip.on{background:var(--ink);color:var(--on);border-color:var(--ink)}
.out{font:500 .85rem "Geist Mono",monospace;color:var(--mute);min-height:1.5em}
.card{border:1px solid var(--line);border-radius:24px;padding:1.6rem;background:color-mix(in srgb,var(--bg) 78%,transparent);backdrop-filter:blur(16px);transition:transform .3s,border-color .3s}
.card:hover{border-color:var(--ink);transform:translateY(-4px)}
.card h3{font-size:2rem;margin:.3rem 0 1.2rem}
dl{display:grid;grid-template-columns:1fr 1fr;gap:1rem 1.5rem;margin:0}
dt{display:flex;align-items:center;gap:.4rem;font:500 .7rem "Geist Mono",monospace;text-transform:uppercase;letter-spacing:.07em;color:var(--mute)}
dd{margin:.2rem 0 0;font-weight:500}.u{text-decoration:underline;text-underline-offset:4px}
.pitch{border-left:2px solid var(--ink);padding-left:1.1rem;margin:0 0 1.5rem;min-height:9.6em}
.pitch.t::after{content:"";display:inline-block;width:2px;height:1em;background:var(--ink);margin-left:2px;vertical-align:-.12em;animation:bl 1s steps(1) infinite}@keyframes bl{50%{opacity:0}}
.kb{display:grid;grid-template-columns:repeat(3,1fr);gap:.8rem;margin-top:1.5rem}
.col h4{font:500 .7rem "Geist Mono",monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--mute);margin-bottom:.6rem}
.col{min-height:8rem;border:1px dashed var(--line);border-radius:16px;padding:.7rem}
.tk{display:block;width:100%;text-align:left;border:1px solid var(--line);background:color-mix(in srgb,var(--bg) 85%,transparent);color:var(--ink);border-radius:12px;padding:.65rem .8rem;margin-bottom:.5rem;font-size:.92rem;cursor:pointer;transition:border-color .2s}
.tk:hover{border-color:var(--ink)}.tk.pop{animation:pop .5s cubic-bezier(.2,.8,.2,1)}@keyframes pop{from{transform:scale(.85);opacity:.3}}
.hint{font-size:.85rem;color:var(--mute);margin-top:.9rem}
.plans{display:grid;grid-template-columns:1fr 1fr;gap:2.5rem;width:100%;max-width:60rem;margin:2.5rem auto 0;text-align:left}
.plan{border:1px solid var(--line);border-radius:24px;padding:1.8rem;background:color-mix(in srgb,var(--bg) 78%,transparent);backdrop-filter:blur(16px)}.plan.pro{border-color:var(--ink)}
.price{font:700 3.6rem Geist,sans-serif;letter-spacing:-.05em;line-height:1}.price small{font:400 1rem Geist,sans-serif;color:var(--mute);letter-spacing:0}
ul.f{list-style:none;padding:0;margin:1.2rem 0 1.5rem}ul.f li{display:flex;gap:.7rem;padding:.42rem 0;border-bottom:1px solid var(--line);font-size:.95rem}
ul.f li::before{content:"";flex:none;width:1em;height:1em;margin-top:.3em;background:currentColor;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 12 5 5L20 6'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 12 5 5L20 6'/%3E%3C/svg%3E") center/contain no-repeat}
ul.f li.no{color:var(--mute)}
.fin h2{font-size:clamp(3rem,9vw,8rem);max-width:13ch;margin:0 auto 2.2rem}
footer{position:absolute;bottom:1.4rem;left:0;right:0;text-align:center;font-size:.85rem;color:var(--mute)}
@media(max-width:899px){.rail{display:none}.sc,.sc.r{justify-content:flex-start}.in{backdrop-filter:blur(3px)}.plans{grid-template-columns:1fr}dl{grid-template-columns:1fr}.hero{justify-content:center}}
.glow{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(520px circle at var(--mx,50%) var(--my,40%),color-mix(in srgb,var(--ink) 7%,transparent),transparent 70%)}
#pins{position:fixed;inset:0;z-index:3;pointer-events:none}
.pin{position:absolute;left:0;top:0;margin:-.55rem 0 0 .9rem;font:500 .72rem "Geist Mono",ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--ink);background:color-mix(in srgb,var(--bg) 80%,transparent);border:1px solid var(--line);backdrop-filter:blur(6px);border-radius:99px;padding:.25rem .7rem;cursor:pointer;opacity:0;pointer-events:none;white-space:nowrap;will-change:transform}
.pin:hover{border-color:var(--ink)}.pin.sel{background:var(--ink);color:var(--on);border-color:var(--ink)}
#pins:not(.on) .pin{opacity:0!important;pointer-events:none!important}
.dragging,.dragging *{cursor:grabbing!important;user-select:none!important}
.sc[data-n]::after{content:attr(data-n);position:absolute;bottom:-.08em;right:1vw;font:700 clamp(12rem,36vw,32rem)/1 Geist,sans-serif;letter-spacing:-.08em;color:transparent;-webkit-text-stroke:1px var(--line);z-index:-1;pointer-events:none}
.sc.r[data-n]::after{right:auto;left:3vw}
@supports (animation-timeline:view()){@keyframes dr{from{transform:translateY(14vh)}to{transform:translateY(-14vh)}}.sc[data-n]::after{animation:dr linear both;animation-timeline:view()}}
@media(max-width:899px){#pins,.hd{display:none}.sc[data-n]::after{font-size:48vw}}
```

### Scout-page additions (verbatim from `lancebuddy-scout2.html`)

```css
.pill{font:500 .75rem "Geist Mono",ui-monospace,monospace;text-transform:uppercase;letter-spacing:.07em;border:1px solid var(--line);border-radius:99px;padding:.5rem .9rem;background:color-mix(in srgb,var(--bg) 70%,transparent);backdrop-filter:blur(12px)}
.sc h1.h1s{font-size:clamp(3rem,8vw,6.5rem);line-height:.95}
.in.wide{max-width:42rem;width:100%}
form label{display:block;font:500 .72rem "Geist Mono",ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--mute);margin:1.3rem 0 .5rem}
input{width:100%;background:color-mix(in srgb,var(--bg) 70%,transparent);border:1px solid var(--line);border-radius:12px;color:var(--ink);font-size:1.05rem;padding:.8rem 1rem;backdrop-filter:blur(8px)}input:focus{outline:0;border-color:var(--ink)}
form .row{margin-top:1.6rem}.chips{margin:0}
.res{list-style:none;padding:0;margin:0 0 1.5rem}
.lr{border-top:1px solid var(--line);padding:1rem 0;animation:in .6s both cubic-bezier(.2,.8,.2,1)}@keyframes in{from{opacity:0;transform:translateX(30px)}}
.rh{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem}.rh b{font-size:1.2rem;letter-spacing:-.02em}.rh span{font-size:.9rem}
.mute{color:var(--mute)}.st{min-width:6.5rem;text-align:center}.st.s1{border-color:var(--ink);color:var(--ink)}.st.s2{background:var(--ink);color:var(--on);border-color:var(--ink)}
.ra{display:flex;gap:.45rem;flex-wrap:wrap;margin-top:.7rem}.ra .chip{padding:.3rem .8rem;font-size:.85rem}
.pt{margin-top:.8rem;border-left:2px solid var(--ink);padding-left:1rem;animation:in .4s both}.pt p{margin:0 0 .6rem;font-size:.95rem}
#hud{position:fixed;left:50%;bottom:1.4rem;z-index:40;transform:translate(-50%,160%);transition:transform .5s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column;gap:.6rem;min-width:min(22rem,90vw);padding:1rem 1.3rem;border:1px solid var(--ink);border-radius:18px;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(14px);font:500 .85rem "Geist Mono",ui-monospace,monospace}
#hud.on{transform:translate(-50%,0)}.hb{height:2px;background:var(--line)}.hb i{display:block;height:100%;background:var(--ink);transform:scaleX(0);transform-origin:0 50%;transition:transform .4s}
#toast{position:fixed;top:5rem;left:50%;transform:translate(-50%,-300%);opacity:0;pointer-events:none;z-index:45;padding:.7rem 1.2rem;border-radius:99px;background:var(--ink);color:var(--on);font-size:.9rem;transition:transform .4s cubic-bezier(.2,.8,.2,1),opacity .3s;max-width:90vw}#toast.on{transform:translate(-50%,0);opacity:1}
.stats3{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin:0 0 1.8rem}.stats3 div{border:1px solid var(--line);border-radius:20px;padding:1.1rem 1.2rem;background:color-mix(in srgb,var(--bg) 78%,transparent);backdrop-filter:blur(12px)}
.stats3 b{display:block;font:700 3.2rem Geist,sans-serif;letter-spacing:-.05em;line-height:1}.stats3 span{font:500 .72rem "Geist Mono",monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--mute)}.stats3 b.bump{animation:pop .5s cubic-bezier(.2,.8,.2,1)}@keyframes pop{from{transform:scale(1.4)}}
.nts{list-style:none;padding:0;margin:0}.nts li{display:flex;gap:.6rem;margin-bottom:.6rem;animation:in .4s both}
.empty{color:var(--mute);border:1px dashed var(--line);border-radius:16px;padding:1.2rem}
.faq{margin:1.5rem 0}details{border-top:1px solid var(--line);padding:1rem 0}summary{cursor:pointer;font-weight:600;list-style:none;display:flex;justify-content:space-between;gap:1rem}summary::after{content:"+"}details[open] summary::after{content:"–"}details p{color:var(--mute);margin:.7rem 0 0}
footer{position:static;margin-top:3rem;padding:0;text-align:left}
@media(max-width:899px){.pill{display:none}}
```

### Reduced motion (end of stylesheet)

```css
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto}}
```

## 12. Responsive / smartphone requirements

The site must look and feel native on phones (target widths **360–430px**, also test 320px and tablets 768–1024px). The reference files already define the core mobile behaviour at **max-width: 899px**; keep all of it, and add the rules below.

**Keep from the references (below 900px):**
- Side rail, city pins and `.hd` hints are hidden; scout `.pill` is hidden.
- Sections are top-aligned (`justify-content:flex-start`), `.sc.r` no longer pushes right.
- `.plans` and `dl` collapse to one column.
- Outlined section number shrinks to `48vw`.
- Globe is centered at `y=.9`, scale `.75` (`.45` on the last/pricing-style section), camera pulled back `+1.5`, so it sits behind the text as a background.
- `.in` gets `backdrop-filter:blur(3px)` so text stays readable over the globe.
- Header uses `max(1rem, env(safe-area-inset-top))`; viewport is `width=device-width, initial-scale=1, viewport-fit=cover`.

**Add for phones (do not change the desktop look):**
- Use `100svh` (never `100vh`) for full-height sections so the mobile browser bar doesn't cut content.
- Add `env(safe-area-inset-left/right/bottom)` padding to the header, `#hud` (bottom) and `footer` so nothing hides under notches or the home indicator.
- **Touch targets at least 44x44px** for `.btn`, `.chip`, `.tk`, `#tg`, summary rows and action chips (increase padding on `max-width:899px` only if needed).
- Inputs keep `font-size:1.05rem` (>=16px) so iOS Safari does not zoom on focus.
- Wrap hover-only effects in `@media (hover:hover)`: card lift, button hover lift, chip hover. Disable **magnetic buttons** and the **cursor spotlight** on touch devices (`@media (hover:none)`).
- Use `touch-action: pan-y` on the page so vertical scroll always works; globe drag on touch must not block scrolling (on phones, drag-to-spin and click-for-shockwave are optional; a tap on empty space may still fire a shockwave).
- Headline sizes already use `clamp()`; verify no horizontal overflow at 320px (`overflow-x:hidden` on `body` is a last resort, fix the cause first).
- `.kb` (3 kanban columns) and `.stats3` (3 tiles) stay 3-up on phones, with reduced padding and smaller text so they fit at 360px; names truncate with ellipsis rather than wrap awkwardly.
- `.lr` result rows: status chip drops under the name if the row is narrower than ~380px; action chips wrap (`.ra{flex-wrap:wrap}`).
- `#hud` width `min(22rem,90vw)`; `#toast` `max-width:90vw`.
- The primary CTA must stay visible in the header on phones (**Start free** on landing). The theme toggle stays in the header on all sizes.
- Performance on phones: keep `devicePixelRatio` capped at 2, pause the render loop when the tab is hidden (`document.hidden`), and respect `prefers-reduced-motion`. If the device is low-powered, reducing the point count (e.g. 2600 to ~1600) is allowed; the look must not change.
- Test matrix: iPhone SE (375x667), iPhone 14/15 (390x844), Pixel 7 (412x915), small Android (360x640), landscape phone, iPad.

## 13. React.js implementation

Build the frontend with **React** (function components + hooks), bundled with **Vite**. The result must render pixel-identical to the reference HTML files.

**Stack**
- React 18+, Vite, JavaScript or TypeScript (TypeScript preferred).
- `react-router-dom`: `/` = Landing page, `/scout` = Scout app page.
- `three@0.128.0` from npm (pin this exact version to match the reference r128 behaviour; the references load it from CDN).
- Fonts: the same Google Fonts link in `index.html`.
- No UI libraries (no Tailwind, MUI, Bootstrap, framer-motion, react-three-fiber). Styling is **plain CSS** copied from section 11 into `src/styles/global.css`, keeping every class name. Scout-only rules go in `src/styles/scout.css`. This is what guarantees an exact match.

**Suggested structure**
```
index.html                 // theme init script (section 2) + font link + viewport meta
src/
  main.jsx                 // router, imports global.css
  styles/global.css  scout.css
  context/SiteContext.jsx  // activeIndex, selectedCity, scanning, shock trigger
  hooks/
    useTheme.js            // reads/writes lb-theme, toggles data-theme on <html>
    useActiveSection.js    // scroll position -> active section index + --sp progress
    usePointer.js          // --mx/--my spotlight + normalized mouse for parallax
    useReducedMotion.js
    useReveal.js           // IntersectionObserver helpers (typewriter)
  components/
    Globe.jsx              // the whole Three.js scene (canvas #gl) + <Pins />
    Header.jsx  ThemeToggle.jsx  Rail.jsx  ProgressBar.jsx  Glow.jsx
    Section.jsx            // <section className="sc ..." data-n>
    Button.jsx  Chip.jsx   // render .btn / .chip classes (magnetic via hook on hover devices only)
    Card.jsx  Pitch.jsx  Kanban.jsx  Plans.jsx  Faq.jsx
    scout/ ScoutForm.jsx  ResultRow.jsx  Results.jsx  Notes.jsx  Stats.jsx  Hud.jsx  Toast.jsx
  pages/ Landing.jsx  Scout.jsx
  data/ cities.js  content.js   // 8 cities with lat/lon, all copy from sections 9-10
```

**Rules**
1. **Markup and class names stay exactly as in the references** (`sc`, `r`, `c`, `in`, `rv`, `k`, `d`, `btn`, `ghost`, `chip`, `on`, `card`, `plans`, `plan pro`, `kb`, `col`, `tk`, `lr`, `ra`, `pt`, `stats3`, `nts`, `hud`, etc.) so the global CSS applies unchanged. Do not convert to CSS modules or styled-components.
2. **Globe lives in one `<Globe />` component mounted once at the app root** (not per page, so it doesn't reload on route change). It receives the per-page pose arrays (`XS, SC, OP, CZ`) as props from section 8.
3. **Never re-render React per animation frame.** Run the Three.js loop with `requestAnimationFrame` inside `useEffect`, keep mutable state (current pose, rotation, shock, selected city, scan flag, pointer) in `useRef`s, and push changes from React into the loop through refs or the context's setters. Only real UI changes (selected chip, results list, counters, quota) use `useState`.
4. **Clean up everything** in the effect return: cancel the animation frame, remove `resize` / `pointer*` / `scroll` listeners, dispose geometries, materials and textures, and the renderer. The component must survive React 18 **StrictMode** double-mounting without duplicate canvases, loops or listeners.
5. City chips are the single source of truth: `cities.js` drives both the chips and the globe markers and pins. `<Pins />` is a React component whose positions are updated by the loop via refs (direct `style.transform`), not by state.
6. Theme: keep the inline script in `index.html` `<head>` (no flash of wrong theme). `useTheme` only reads `data-theme` and toggles it, using the same `lb-theme` key. The globe repaints from `--ink` every 30 frames as in the reference.
7. Scroll-driven effects (`.rv` reveal, section-number parallax) stay in CSS (`animation-timeline: view()`). Do not reimplement them in JS.
8. **Scout page state (React):** `industry`, `city`, `email`, `quota` (starts at 5), `rows` (each with status `0|1|2`), `notes`, `busy`, `hudMessage`, `progress`. Counters (`New / Contacted / Converted`) are **derived** from `rows`, not stored. Scan timers (520ms rows, 900ms HUD messages) use `useEffect` with cleanup. Toast is a small context with a 2400ms auto-hide.
9. **Persistence:** pipeline and notes stay in the browser (localStorage, wrapped in try/catch) as the copy promises; never send them to a server.
10. Replace the sample generator (`makeRow`) with the real lead-generation call behind a single `scoutLeads(industry, city)` function in `src/services/`, so the UI stays unchanged. Do not put API keys in the frontend bundle.
11. Accessibility from section 14 applies: real `<button>`/`<a>`/`<label>` elements, `aria-label` on the theme toggle, `role="status"` on HUD and toast, focus-visible outline kept.
12. Route changes scroll to top and reset the active section index; the `Rail` and `ProgressBar` read the active page's sections.
13. Deploy as a static build (`vite build`), so it keeps working on the current Cloudflare Workers/Pages hosting.

## 14. Accessibility and quality bar

- `:focus-visible` = 2px ink outline, 3px offset. Keep it.
- Decorative layers (`#gl`, `.glow`, `.prog`) are `aria-hidden`; HUD and toast use `role="status"`; theme toggle has `aria-label`; pins container labelled "City markers"; inputs have real `<label>`s or `aria-label`s.
- Must work with JS errors in the globe (try/catch + `nogl` fallback), with `prefers-reduced-motion`, and on 380px-wide screens with `viewport-fit=cover` and safe-area padding on the header.
- Keep external resources to Google Fonts only (Three.js is bundled via npm in the React build).

## 15. Implementation checklist

1. Add the reference files to `/reference/` and keep them untouched.
2. Create the Vite + React project with the structure in section 13; add `three@0.128.0`.
3. Copy section 11 CSS into `global.css` (and the scout additions into `scout.css`) without edits.
4. Put the theme init script and font link in `index.html`; set the viewport meta exactly as in the references.
5. Build `Globe`, `Header`, `Rail`, `ProgressBar`, `Glow` once at the app root; port the globe script faithfully into `Globe.jsx` (refs for state, full cleanup).
6. Build the Landing page from section 9 and the Scout page from section 10 as React components using the reference markup and class names.
7. Apply the smartphone requirements in section 12 and test on the device matrix.
8. Wire the scout flow to the real lead-generation service; keep the DOM and class names unchanged.
9. Keep the `lb-theme` key, the 899px breakpoint, section ids (`s0...`) and rail labels.
10. Remove any old UI not in this spec (extra colors, shadows, gradients, icons, imagery, other fonts).
11. Verify: light + dark, desktop + phone + tablet, reduced motion, globe disabled (`nogl`), keyboard navigation, StrictMode (no double globe), no horizontal scroll at 320px.
