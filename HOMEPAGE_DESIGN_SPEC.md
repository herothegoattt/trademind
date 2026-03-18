# TradeMind FinTech Homepage Design Specification

## 1. COLOR PALETTE & GRADIENTS

### Primary Colors (Dark Theme)
```
- Base Darkest: #0a0e27 (near black, slight blue tint)
- Base Dark: #0f1729 (card backgrounds, sections)
- Base Medium: #1a2849 (elevated surfaces, borders)
- Base Light: #2d3e5f (hover states, secondary elements)
```

### Accent Colors (Strategic & Purposeful)
```
- Cyan Primary: #00d9ff (CTAs, highlights, alerts)
- Cyan Glow: rgba(0, 217, 255, 0.2) (glows, subtle overlays)
- Accent Purple: #7c3aed (secondary CTAs, feature highlights)
- Accent Blue: #3b82f6 (tertiary accents, data visualization)
- Success Green: #10b981 (positive results, gains)
```

### Gradient Definitions (CSS)
```css
/* Hero Primary Gradient - Dynamic Energy */
background: linear-gradient(135deg, #0a0e27 0%, #1a2849 50%, #0f1729 100%);

/* Accent Glow - Cyan emphasis */
background: linear-gradient(90deg, #00d9ff 0%, rgba(0, 217, 255, 0.1) 100%);

/* Feature Card Hover - Subtle elevation */
background: linear-gradient(135deg, rgba(0, 217, 255, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%);

/* Button CTA - Primary attention */
background: linear-gradient(135deg, #00d9ff 0%, #0fb7db 100%);

/* Border Accent - Premium feel */
border-image: linear-gradient(135deg, #00d9ff, #7c3aed) 1;
```

---

## 2. TYPOGRAPHY SYSTEM

### Font Stack
```css
/* Primary (Headlines, emphasis) */
font-family: 'Inter', 'Segoe UI', sans-serif;
font-weight: 500-700;
letter-spacing: -0.01em; /* Tighter for sophistication */

/* Secondary (Body, description) */
font-family: 'Inter', -apple-system, sans-serif;
font-weight: 400-500;
letter-spacing: 0em;
```

### Type Scale (Modular 1.25x)
```
Display XL:   64px / 96px line-height / 700 weight (Hero headline)
Display L:    48px / 72px line-height / 700 weight (Section headlines)
Display M:    36px / 54px line-height / 600 weight (Subsection headers)
Heading XL:   28px / 42px line-height / 600 weight (Card titles)
Heading M:    22px / 33px line-height / 600 weight (Feature headers)
Heading S:    18px / 27px line-height / 500 weight (Subheaders)
Body XL:      16px / 24px line-height / 500 weight (Feature descriptions)
Body M:       14px / 21px line-height / 400 weight (Secondary text)
Body S:       12px / 18px line-height / 400 weight (Metadata, labels)
```

### Usage Examples
```
Hero Headline: "AI-Powered Trading Intelligence" → Display XL (64px)
Hero Subheadline: "Real-time risk analysis & community insights" → Body XL (16px)
Feature Title: "AI Coach" → Heading M (22px)
Feature Description: "Personalized coaching..." → Body M (14px)
Button Label: "Access Dashboard" → Body M, 500 weight
Metadata: "Updated 2 minutes ago" → Body S (12px)
```

---

## 3. SPACING & GRID SYSTEM

### Base Unit: 8px (8px Grid)
```
xs:  4px   (micro spacing within components)
sm:  8px   (tight spacing, inline padding)
md:  16px  (standard spacing, component padding)
lg:  24px  (component gaps, section divisions)
xl:  32px  (major spacing between feature blocks)
2xl: 48px  (section padding, breathing room)
3xl: 64px  (major section gaps)
```

### Layout Proportions
```
Container Max Width: 1440px (premium, not cramped)
Horizontal Padding: 48px (desktop), 24px (tablet), 16px (mobile)
Vertical Section Padding: 96px (desktop), 64px (tablet), 48px (mobile)
Gap Between Features: 32px (creates visual breathing)
Card Padding: 32px (never crowd content)
```

### Vertical Rhythm
```
Section → Section Gap: 96px
Feature Block → Feature Block: 32px
Text Block → Next Element: 24px
Line Height Multiplier: 1.5x (readability + premium spacing)
```

---

## 4. COMPONENT LAYOUTS

### HERO SECTION
```
Layout: Single column, centered, maximum 900px
Structure:
  - Headline: 64px, 700 weight, cyan accent word
  - Subheadline: 16px, 400 weight, muted text (light gray)
  - Spacing after subheadline: 48px
  - CTA Buttons: Dual buttons (Primary cyan, Secondary outlined)
  - Spacing: 96px padding top/bottom, 48px sides

Visual Treatment:
  - Subtle gradient background (135deg)
  - Animated gradient accent line (5px) above headline
  - Glow effect around CTA buttons on hover
  - No heavy animations—CSS radial-gradient for glow
```

### FEATURES GRID
```
Layout: 3-column grid (responsive: 2-col tablet, 1-col mobile)
Card Structure:
  - Icon area: 64x64px, cyan accent color, subtle glow
  - Title: 22px, 600 weight
  - Description: 14px, 400 weight, muted gray
  - Card padding: 32px
  - Card background: rgba(255, 255, 255, 0.02) with border
  - Border: 1px solid rgba(0, 217, 255, 0.2)
  - Gap between cards: 32px
  
Hover State:
  - Background tint: subtle cyan gradient (0.05 opacity)
  - Border: 1px solid rgba(0, 217, 255, 0.4)
  - Transform: translateY(-4px) — minimal, elegant
  - Duration: 300ms ease-out
  - Shadow: 0 8px 32px rgba(0, 217, 255, 0.1)
```

### NAVIGATION / TABS
```
Style: Minimal pill design, not heavy bars
Structure:
  - Tabs horizontal, centered above features
  - Tab padding: 12px 24px
  - Inactive tab: transparent background, gray text
  - Active tab: cyan background with subtle glow
  - Underline indicator: 3px cyan, positioned under active tab
  - Transition: smooth 200ms

Spacing:
  - Gap between tabs: 16px
  - Margin below nav: 48px before content
```

### STATISTICS / METRICS SECTION
```
Layout: 4-column grid with large numbers
Card Structure:
  - Large number: 48px, 700 weight, cyan color
  - Label: 14px, 400 weight, muted gray
  - Optional description: 12px, secondary text
  - Padding: 24px
  - Background: glass effect (rgba(255, 255, 255, 0.02))
  - Border: 1px solid rgba(0, 217, 255, 0.15)
  
Gap between cards: 24px
Responsive: 2x2 tablet, 1 column mobile
```

### CALL-TO-ACTION BUTTONS
```
Primary (Cyan):
  - Background: linear-gradient(135deg, #00d9ff, #0fb7db)
  - Padding: 16px 32px
  - Font: 14px, 500 weight, dark text
  - Border radius: 8px
  - Box-shadow: 0 4px 16px rgba(0, 217, 255, 0.3)
  - Hover: shadow 0 8px 32px rgba(0, 217, 255, 0.45)
  - Active: scale(0.98)
  - Transition: all 200ms ease-out

Secondary (Outlined):
  - Background: transparent
  - Border: 2px solid rgba(0, 217, 255, 0.4)
  - Color: #00d9ff
  - Padding: 14px 30px (inside border)
  - Hover: background rgba(0, 217, 255, 0.1), shadow 0 4px 16px rgba(0, 217, 255, 0.2)
  - Transition: all 200ms ease-out
```

---

## 5. ANIMATION APPROACH

### Core Philosophy
✅ **Use CSS animations** for performance (GPU-accelerated)
❌ **Avoid JavaScript animations** that cause frame drops
✅ **Micro-interactions** (hover states, focus, transitions)
❌ **Heavy parallax, continuous looping** (unless essential)

### Recommended Animations

#### 1. Gradient Shift (Subtle, Elegant)
```css
@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Applied to accent lines or backgrounds */
animation: gradientShift 8s ease-in-out infinite;
background-size: 200% 200%;
```

#### 2. Glow Effect (Premium, Subtle)
```css
@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px rgba(0, 217, 255, 0.2); }
  50% { box-shadow: 0 0 40px rgba(0, 217, 255, 0.4); }
}

animation: glow 3s ease-in-out infinite;
```

#### 3. Hover Lift (Smooth Elevation)
```css
transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
/* cubic-bezier for slightly bouncy feel */

:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.3);
}
```

#### 4. Fade-in On Scroll (Intersection Observer + CSS)
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeInUp 600ms ease-out forwards;
}
```

#### 5. Border Animation (Minimal, Sophisticated)
```css
@keyframes borderGlow {
  0%, 100% { border-color: rgba(0, 217, 255, 0.2); }
  50% { border-color: rgba(0, 217, 255, 0.5); }
}

animation: borderGlow 3s ease-in-out infinite;
```

### Performance Rules
- Max animation duration: 800ms (snappy, not slow)
- Use `transform` and `opacity` only (GPU-accelerated)
- Avoid animating: width, height, position, top/left/right
- Debounce scroll animations with Intersection Observer

---

## 6. VISUAL HIERARCHY

### Information Density (Premium = Breathing Room)
```
Not: Cramped 12px padding cards everywhere
Yes: 32px padding, generous gaps, clear visual separation

Information Priority (Attention Flow):
1. Hero Section (60% viewport focus)
   └─ Headline (cyan accent on key word)
   └─ Subheadline
   └─ Primary CTA (cyan glow)

2. Feature Cards (equal weight, 3-column harmony)
   └─ Icon (visual anchor)
   └─ Title (22px)
   └─ Description

3. Statistical/Proof Elements (trust builders)
   └─ Large numbers in cyan
   └─ Clear labels

4. Secondary CTA (bottom)
   └─ Lower visual priority
   └─ Outlined style
```

### Visual Weight (Contrast & Color)
```
Darkest Elements: Backgrounds (#0a0e27)
Dark Elements: Cards (#0f1729)
Medium Elements: Text, icons (light gray: #b0b9d4)
Bright Accents: CTAs, highlights (cyan #00d9ff)
Strongest Contrast: Headlines vs background
```

### Size Hierarchy
```
Hero Headline: 64px (massive impression)
Feature Headers: 22px (clear but not overwhelming)
Body Text: 14-16px (readable, not crowded)
Labels: 12px (secondary info)
```

---

## 7. SPECIFIC RECOMMENDATIONS

### For Premium "Bloomberg/Stripe/Figma" Feel

✅ **DO:**
- Use monospace font for numbers (trading data aesthetic)
- Add subtle data visualization (small charts in cards)
- Implement a dark theme exclusively (trust + professionalism)
- Use 2-3 accent colors max (cyan primary, purple secondary)
- Spacious padding on cards (32px minimum)
- Cyan accents strategically placed (CTAs only, not scattered)
- Smooth 300ms transitions (feels premium, not instant)
- Glass-morphism cards (rgba with backdrop-filter)
- Minimal icon design (24-32px, stroke-based)

❌ **DON'T:**
- Rainbow accent colors
- Heavy shadows or drop shadows
- Auto-playing videos or loud animations
- More than 2 font families
- Animations longer than 800ms
- Gradients on text (hard to read)
- Heavy blur/frosted glass effects
- Too many accent sizes (stick to 8px grid)

### Component-Level Recommendations

**Hero Section:**
- Combine cyan headline word with white text for pop
- Subtle animated gradient line (5px) above headline
- Dual button approach: "Get Started" (cyan) + "Learn More" (outlined)
- Optional: Small video/animation background (muted, slow, professional)

**Feature Cards:**
- Icon sits at top-left (64x64px)
- Title directly below icon
- Description at bottom
- Hover effect: slight lift + cyan glow border
- No shadow until hover (cleaner default state)

**Navigation:**
- Horizontal pills, not tabs
- Active state: full cyan background with glow
- Underline indicator: 3px beneath
- Smooth 200ms transition between states

**Social Proof / Stats:**
- 4-column grid: Users, AI Decisions, Community Members, AUM
- Large cyan numbers (48px)
- Gray labels below
- Optional: upward indicator (small green arrow)

---

## 8. IMPLEMENTATION CHECKLIST

### Phase 1: Foundation
- [ ] Set up CSS custom properties (variables) for colors, spacing
- [ ] Create typography scale in Tailwind config
- [ ] Define animation keyframes in global CSS
- [ ] Build base button components (primary, secondary)

### Phase 2: Hero
- [ ] Layout hero section with proper spacing
- [ ] Implement headline with cyan accent word
- [ ] Add animated gradient accent line
- [ ] Style dual CTA buttons with hover effects

### Phase 3: Features
- [ ] Build 3-column feature grid
- [ ] Design feature cards (icon + title + description)
- [ ] Implement hover lift effect (CSS)
- [ ] Add border glow animation

### Phase 4: Polish
- [ ] Test all animations on 60fps
- [ ] Verify color contrast (WCAG AA minimum)
- [ ] Mobile responsive testing (1-col, 2-col layouts)
- [ ] Performance audit (lighthouse)

---

## 9. TAILWIND CONFIG EXTENSIONS

### Custom Colors
```javascript
colors: {
  'dark': {
    'base': '#0a0e27',
    'surface': '#0f1729',
    'elevated': '#1a2849',
    'hover': '#2d3e5f',
  },
  'accent': {
    'cyan': '#00d9ff',
    'purple': '#7c3aed',
    'blue': '#3b82f6',
  }
}
```

### Custom Spacing
```javascript
spacing: {
  'xs': '4px',
  'sm': '8px',
  'md': '16px',
  'lg': '24px',
  'xl': '32px',
  '2xl': '48px',
  '3xl': '64px',
}
```

### Custom Animation
```javascript
animation: {
  'glow': 'glow 3s ease-in-out infinite',
  'gradient': 'gradientShift 8s ease-in-out infinite',
  'fadeInUp': 'fadeInUp 600ms ease-out',
}
```

---

## 10. ACCESSIBILITY NOTES

- Text contrast: All body text > 7:1 ratio (dark bg, light text)
- Buttons: min 44x44px touch target
- Focus states: Cyan outline (2px) on keyboard focus
- Animations: respect `prefers-reduced-motion`
- Color-blind safe: Don't rely on red/green alone for status

