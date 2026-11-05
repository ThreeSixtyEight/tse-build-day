---
name: figma-implement-design
description: Translates Figma designs into production-ready application code with 1:1 visual fidelity. Use when implementing UI code from Figma files, when user mentions "implement design", "generate code", "implement component", provides Figma URLs, or asks to build components matching Figma specs. For Figma canvas writes via `use_figma`, use `figma-use`.
---

# Implement Design

## Overview

This skill provides a structured workflow for translating Figma designs into production-ready code with pixel-perfect accuracy. It ensures consistent integration with the Figma MCP server, proper use of design tokens, and 1:1 visual parity with designs.

## Skill Boundaries

- Use this skill when the deliverable is code in the user's repository.
- This skill checks the Figma file for a frame named **"Style Guide"** and treats it as the source of truth for the project's Tailwind defaults (colors, typography, and base components like buttons, form fields, and headers) — see Step 5.
- If the user asks to create/edit/delete nodes inside Figma itself, switch to [figma-use](../figma-use/SKILL.md).
- If the user asks to build or update a full-page screen in Figma from code or a description, switch to [figma-generate-design](../figma-generate-design/SKILL.md).
- If the user asks only for Code Connect mappings, switch to [figma-code-connect-components](../figma-code-connect-components/SKILL.md).
- If the user asks to author reusable agent rules (`CLAUDE.md`/`AGENTS.md`), switch to [figma-create-design-system-rules](../figma-create-design-system-rules/SKILL.md).

## Prerequisites

- Figma MCP server must be connected and accessible
- User must provide a Figma URL in the format: `https://figma.com/design/:fileKey/:fileName?node-id=1-2`
  - `:fileKey` is the file key
  - `1-2` is the node ID (the specific component or frame to implement)
- **OR** when using `figma-desktop` MCP: User can select a node directly in the Figma desktop app (no URL required)
- Project should have an established design system or component library (preferred)
- (Optional) A frame named **"Style Guide"** in the same Figma file, defining default colors, typography, and base components (buttons, form fields, headers) — used to establish/verify the project's Tailwind theme (see Step 5)

## Required Workflow

**Follow these steps in order. Do not skip steps.**

### Step 1: Get Node ID

#### Option A: Parse from Figma URL

When the user provides a Figma URL, extract the file key and node ID to pass as arguments to MCP tools.

**URL format:** `https://figma.com/design/:fileKey/:fileName?node-id=1-2`

**Extract:**

- **File key:** `:fileKey` (the segment after `/design/`)
- **Node ID:** `1-2` (the value of the `node-id` query parameter)

**Note:** When using the local desktop MCP (`figma-desktop`), `fileKey` is not passed as a parameter to tool calls. The server automatically uses the currently open file, so only `nodeId` is needed.

**Example:**

- URL: `https://figma.com/design/kL9xQn2VwM8pYrTb4ZcHjF/DesignSystem?node-id=42-15`
- File key: `kL9xQn2VwM8pYrTb4ZcHjF`
- Node ID: `42-15`

#### Option B: Use Current Selection from Figma Desktop App (figma-desktop MCP only)

When using the `figma-desktop` MCP and the user has NOT provided a URL, the tools automatically use the currently selected node from the open Figma file in the desktop app.

**Note:** Selection-based prompting only works with the `figma-desktop` MCP server. The remote server requires a link to a frame or layer to extract context. The user must have the Figma desktop app open with a node selected.

### Step 2: Fetch Design Context

Run `get_design_context` with the extracted file key and node ID.

```
get_design_context(fileKey=":fileKey", nodeId="1-2")
```

This provides the structured data including:

- Layout properties (Auto Layout, constraints, sizing)
- Typography specifications
- Color values and design tokens
- Component structure and variants
- Spacing and padding values

**If the response is too large or truncated:**

1. Run `get_metadata(fileKey=":fileKey", nodeId="1-2")` to get the high-level node map
2. Identify the specific child nodes needed from the metadata
3. Fetch individual child nodes with `get_design_context(fileKey=":fileKey", nodeId=":childNodeId")`

### Step 3: Capture Visual Reference

Run `get_screenshot` with the same file key and node ID for a visual reference.

```
get_screenshot(fileKey=":fileKey", nodeId="1-2")
```

This screenshot serves as the source of truth for visual validation. Keep it accessible throughout implementation.

### Step 4: Download Required Assets

Download any assets (images, icons, SVGs) returned by the Figma MCP server.

**IMPORTANT:** Follow these asset rules:

- If the Figma MCP server returns a `localhost` source for an image or SVG, use that source directly
- DO NOT import or add new icon packages - all assets should come from the Figma payload
- DO NOT use or create placeholders if a `localhost` source is provided
- Assets are served through the Figma MCP server's built-in assets endpoint

### Step 5: Check for a Style Guide Frame (Design Tokens & Base Components)

Before translating Figma output into project conventions, check whether the Figma file has a frame named **"Style Guide"** (case-insensitive) — typically on a dedicated "Style Guide" / "Foundations" page in the file (it may be buried inside a generic "Working" page — search the whole file tree, not just top-level pages). This frame is the canonical source for the project's Tailwind defaults: color palette, typography scale, and base component styles (buttons, form fields, headers/nav).

1. If a Style Guide URL/node wasn't provided, run `get_metadata(fileKey=":fileKey")` and search the node tree for a frame named "Style Guide". `get_metadata` results for large files routinely exceed the tool's token limit and get saved to a file — when that happens, grep/jq that file for `name="..."` matches containing "style guide" rather than retrying the call, or delegate the search to a subagent. If none is found, skip this step and proceed with the project's existing tokens.
2. Run `get_design_context`, `get_screenshot`, and `get_variable_defs` on the Style Guide frame to extract color, typography, and spacing tokens plus base component specs (buttons, form fields, headers). Within the Style Guide, look for a **"Type"** section/frame — its text nodes are typically named/labeled with the raw font spec (e.g. "Favorit Pro Suffolk, Regular, 100px"). The `get_design_context` response for this section appends a list of the file's **named text styles** as `Font(family, style, size, weight, lineHeight, letterSpacing)` records (e.g. `Heading LG Regular: Font(family: "Favorit Pro Suffolk", style: Regular, size: 100, weight: 400, lineHeight: 0.92, letterSpacing: -3)`) — this list is the source of truth for Step 5b below.
3. Cross-reference against the project's current Tailwind theme:
   - Colors, spacing, and animation tokens → `@theme` block in `src/styles/main.css`
   - **Typography → named `@utility` classes**, not `@theme` `--text-*` variables — see Step 5b below
   - Buttons, form fields, header/nav base styles → `@layer components` in `src/styles/main.css` and/or `template-parts/components/` and `template-parts/layout/site-header.php`
4. If a token or base component in the Style Guide is missing or differs from the current project setup, update `src/styles/main.css` (and the relevant template part) to match the Style Guide before continuing — this establishes the defaults that Step 6 maps Figma values onto.
5. If no Style Guide frame exists in the file, skip this step and proceed with the project's existing design tokens as-is.

#### Step 5b: Typography as named `@utility` classes

Each named text style from the Type section's `Font(...)` list becomes its own Tailwind v4 `@utility` class in `src/styles/main.css`, kebab-cased directly from the Figma style name — e.g. "Heading LG Regular" → `.heading-lg-regular`, "Paragraph MD Book" → `.paragraph-md-book`, "All Caps MD Regular (Button Text)" → `.all-caps-md-regular`. Each utility bundles **every** property of that style into one class via `@apply`, so a render.php never has to recompose font-family + size + line-height + letter-spacing + weight by hand:

```css
@utility heading-lg-regular {
  @apply font-display text-[100px] leading-[0.92] tracking-[-0.03em] font-normal;
}

@utility paragraph-md-book {
  @apply font-display text-[20px] leading-[1.27] tracking-[-0.02em] font-[350];
}

@utility all-caps-md-regular {
  @apply font-display text-[16px] leading-[1.2] tracking-[0.06em] font-normal uppercase;
}
```

Conversions from the `Font(...)` record to Tailwind:

- `family` → the project's display font-family utility (e.g. `font-display`, backed by `--font-display` in `@theme`)
- `size` → `text-[{size}px]`
- `lineHeight` → `leading-[{lineHeight}]` (use `leading-none` when the value is exactly `1`)
- `letterSpacing` → **this value is a percentage of the font-size**, so divide by 100 to get the `em` value directly: `letterSpacing: -3` → `tracking-[-0.03em]`, `letterSpacing: 6` → `tracking-[0.06em]` (this conversion is independent of font size)
- `style`/`weight` → a Tailwind font-weight utility: Light (300) → `font-light`, Book (350) → `font-[350]` (no built-in Tailwind keyword), Regular (400) → `font-normal`, Medium (500) → `font-medium`, Bold (700) → `font-bold`
- "All Caps" styles → add `uppercase`
- Do **not** add color or spacing utilities to these classes — they're typography-only, composed with color/layout classes at the call site (e.g. `<h2 class="heading-lg-regular text-navy">`)

This replaces the older convention of defining bare `--text-{name}` / `--text-{name}--line-height` / `--text-{name}--letter-spacing` variables in `@theme` (Tailwind auto-generates a `text-{name}` size utility from those, but it can't express font-family or font-weight, so multi-property Figma text styles got silently split across an auto-generated size utility plus hand-written `font-display`/`tracking-[...]` on every usage). If `@theme` `--text-*` variables for typography already exist in the project, migrate them to `@utility` classes using this convention and update call sites — don't add new `--text-*` variables.

When a render.php needs a smaller variant at narrower breakpoints that doesn't correspond to its own named Figma style (common for responsive headings that scale down on mobile), keep the ad-hoc Tailwind classes for the smaller breakpoints and apply the named utility only at the breakpoint where it matches the Style Guide, e.g.:

```php
<h2 class="font-display text-4xl leading-none tracking-[-0.04em] text-white sm:text-6xl lg:heading-lg-regular">
```

### Step 6: Translate to Project Conventions

Translate the Figma output into this project's framework, styles, and conventions.

**Key principles:**

- Treat the Figma MCP output (typically React + Tailwind) as a representation of design and behavior, not as final code style
- Replace Tailwind utility classes with the project's preferred utilities or design system tokens
- Prefer the tokens and base components established from the Style Guide frame (Step 5) when present
- Reuse existing components (buttons, inputs, typography, icon wrappers) instead of duplicating functionality
- Use the project's color system, typography scale, and spacing tokens consistently
- Respect existing routing, state management, and data-fetch patterns

### Step 7: Achieve 1:1 Visual Parity

Strive for pixel-perfect visual parity with the Figma design.

**Guidelines:**

- Prioritize Figma fidelity to match designs exactly
- Avoid hardcoded values - use design tokens from Figma where available
- When conflicts arise between design system tokens and Figma specs, prefer design system tokens but adjust spacing or sizes minimally to match visuals
- Follow WCAG requirements for accessibility
- Add component documentation as needed

### Step 8: Validate Against Figma

Before marking complete, validate the final UI against the Figma screenshot.

**Validation checklist:**

- [ ] Layout matches (spacing, alignment, sizing)
- [ ] Typography matches (font, size, weight, line height)
- [ ] Colors match exactly
- [ ] Interactive states work as designed (hover, active, disabled)
- [ ] Responsive behavior follows Figma constraints
- [ ] **Tested at every major viewport width, not just the design spec.** Resize through at least 390, 768, 1024, 1280, 1440, and 1920 (Playwright `browser_resize`, scroll the section so reveal animations run, then screenshot/measure). Look for overlapping, clipped, or wrapped elements and horizontal overflow (`document.documentElement.scrollWidth > innerWidth`). Fixed-px compositions (collages, pinned boards, mega panels) break most often between `lg` (1024) and the 1440 spec, where grid columns are narrower than the fixed-width items placed in them — add intermediate breakpoints or fluid sizing rather than reporting a 1440-only result.
- [ ] Assets render correctly
- [ ] Accessibility standards met

## Implementation Rules

### Component Organization

- Place UI components in the project's designated design system directory
- Follow the project's component naming conventions
- Avoid inline styles unless truly necessary for dynamic values

### Design System Integration

- ALWAYS use components from the project's design system when possible
- Map Figma design tokens to project design tokens
- When a matching component exists, extend it rather than creating a new one
- Document any new components added to the design system

### Code Quality

- Avoid hardcoded values - extract to constants or design tokens
- Keep components composable and reusable
- Add TypeScript types for component props
- Include JSDoc comments for exported components

## Examples

### Example 1: Implementing a Button Component

User says: "Implement this Figma button component: https://figma.com/design/kL9xQn2VwM8pYrTb4ZcHjF/DesignSystem?node-id=42-15"

**Actions:**

1. Parse URL to extract fileKey=`kL9xQn2VwM8pYrTb4ZcHjF` and nodeId=`42-15`
2. Run `get_design_context(fileKey="kL9xQn2VwM8pYrTb4ZcHjF", nodeId="42-15")`
3. Run `get_screenshot(fileKey="kL9xQn2VwM8pYrTb4ZcHjF", nodeId="42-15")` for visual reference
4. Download any button icons from the assets endpoint
5. Check if project has existing button component
6. If yes, extend it with new variant; if no, create new component using project conventions
7. Map Figma colors to project design tokens (e.g., `primary-500`, `primary-hover`)
8. Validate against screenshot for padding, border radius, typography

**Result:** Button component matching Figma design, integrated with project design system.

### Example 2: Building a Dashboard Layout

User says: "Build this dashboard: https://figma.com/design/pR8mNv5KqXzGwY2JtCfL4D/Dashboard?node-id=10-5"

**Actions:**

1. Parse URL to extract fileKey=`pR8mNv5KqXzGwY2JtCfL4D` and nodeId=`10-5`
2. Run `get_metadata(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId="10-5")` to understand the page structure
3. Identify main sections from metadata (header, sidebar, content area, cards) and their child node IDs
4. Run `get_design_context(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId=":childNodeId")` for each major section
5. Run `get_screenshot(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId="10-5")` for the full page
6. Download all assets (logos, icons, charts)
7. Build layout using project's layout primitives
8. Implement each section using existing components where possible
9. Validate responsive behavior against Figma constraints

**Result:** Complete dashboard matching Figma design with responsive layout.

## Best Practices

### Always Start with Context

Never implement based on assumptions. Always fetch `get_design_context` and `get_screenshot` first.

### Incremental Validation

Validate frequently during implementation, not just at the end. This catches issues early.

### Document Deviations

If you must deviate from the Figma design (e.g., for accessibility or technical constraints), document why in code comments.

### Reuse Over Recreation

Always check for existing components before creating new ones. Consistency across the codebase is more important than exact Figma replication.

### Design System First

When in doubt, prefer the project's design system patterns over literal Figma translation.

## Common Issues and Solutions

### Issue: Figma output is truncated

**Cause:** The design is too complex or has too many nested layers to return in a single response.
**Solution:** Use `get_metadata` to get the node structure, then fetch specific nodes individually with `get_design_context`.

### Issue: Design doesn't match after implementation

**Cause:** Visual discrepancies between the implemented code and the original Figma design.
**Solution:** Compare side-by-side with the screenshot from Step 3. Check spacing, colors, and typography values in the design context data.

### Issue: Assets not loading

**Cause:** The Figma MCP server's assets endpoint is not accessible or the URLs are being modified.
**Solution:** Verify the Figma MCP server's assets endpoint is accessible. The server serves assets at `localhost` URLs. Use these directly without modification.

### Issue: Design token values differ from Figma

**Cause:** The project's design system tokens have different values than those specified in the Figma design.
**Solution:** When project tokens differ from Figma values, prefer project tokens for consistency but adjust spacing/sizing to maintain visual fidelity.

### Issue: Style Guide frame can't be found

**Cause:** The frame may not exist in this file, may be on a different page, or be named differently (e.g. "Design System", "Foundations").
**Solution:** Skip Step 5 and proceed with the project's existing Tailwind tokens. If the user expects a Style Guide to exist, ask them for a direct link to the frame rather than guessing.

## Understanding Design Implementation

The Figma implementation workflow establishes a reliable process for translating designs to code:

**For designers:** Confidence that implementations will match their designs with pixel-perfect accuracy.
**For developers:** A structured approach that eliminates guesswork and reduces back-and-forth revisions.
**For teams:** Consistent, high-quality implementations that maintain design system integrity.

By following this workflow, you ensure that every Figma design is implemented with the same level of care and attention to detail.

## Additional Resources

- [Figma MCP Server Documentation](https://developers.figma.com/docs/figma-mcp-server/)
- [Figma MCP Server Tools and Prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)
- [Figma Variables and Design Tokens](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)