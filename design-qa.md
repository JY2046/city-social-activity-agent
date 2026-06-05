**Findings**
- No P0/P1/P2 blockers remain for this rebuild pass.

**Source Visual Truth**
- Home source: `/Users/lily/.codex/generated_images/019e91b4-95ca-7a81-b267-a2f0dfef33fc/ig_09f7a6d86af070f2016a2235d228648195b351c711a2aed3fc.png`
- JuZhang source: `/Users/lily/.codex/generated_images/019e91b4-95ca-7a81-b267-a2f0dfef33fc/ig_09f7a6d86af070f2016a223670d3748195ad58821ba5dadf8f.png`

**Implementation Screenshots**
- Home: `/private/tmp/city-social-hifi-home-3.png`
- JuZhang accepted state: `/private/tmp/city-social-hifi-juzhang-3.png`

**Viewport**
- `390 x 844`

**State**
- Home: discovery feed at initial load.
- JuZhang: user accepted JuZhang task after signup flow.

**Comparison Evidence**
- Home full-view comparison: `/private/tmp/city-social-hifi-home-comparison.png`
- JuZhang full-view comparison: `/private/tmp/city-social-hifi-juzhang-comparison.png`
- Focused region comparison: not separately needed for this pass; the compared differences are visible in the full mobile viewport.

**Fidelity Surfaces**
- Typography: the rebuilt screens use heavier display hierarchy, smaller dense metadata, and green/red emphasis on the home headline to match the selected mockups more closely.
- Spacing/layout: home card order now follows the source order: featured sushi, coffee, free walk, then platform cues. JuZhang now uses a full dark details workspace rather than a light shell with dark cards.
- Colors/tokens: home uses warm off-white, deep green, and tomato-red action color; JuZhang uses black, translucent panels, green task accents, purple topic card, and orange/red bottom CTA.
- Image quality/assets: added `venue-night.jpg` from the JuZhang source and reworked activity/skyline assets. Remaining visual difference is mostly from unavailable clean source-layer food imagery.
- Copy/content: existing product fields remain wired: activity title, venue, time, headcount, price/free state, AI recommendation, topic card, and AA/free settlement state.

**Patches Made Since Previous QA Pass**
- Rebuilt ActivityHome display order and product cue placement to match the source composition.
- Rebuilt JuZhangPanel as a full dark activity details/task workspace with hero, AI reminder, accepted banner, task grid, AI topic card, AA flow, mutual-selection card, and bottom actions.
- Added `public/images/venue-night.jpg` for the dark hero.
- Fixed GitHub Pages asset resolution by passing the skyline image as a CSS variable.
- Preserved accessible labels required by the existing tests.

**Follow-up Polish**
- P3: The home featured food image still cannot perfectly match the generated source because the source mock does not provide a clean underlying sushi asset layer.
- P3: The home bottom platform-cue row is present in source order, but the fixed navigation can obscure its first-screen reveal on the 390 x 844 viewport.

final result: passed
