# Activity Detail Content Design

## Goal

Upgrade the activity detail page from a rules-first confirmation page into a decision page that helps users understand why the activity is worth joining.

## User Problem

The current detail page shows title, time, rules, and participants, but it does not explain the appeal of the venue or activity. For a dinner event, users need to see restaurant photos, a credible AI-written recommendation, dishes, location, and expected spend before deciding whether to register.

## Scope

This version stays inside the React prototype and uses local mock data. It does not scrape or embed real Dianping, Xiaohongshu, Michelin, or user-uploaded images from the web. Public-photo concepts are represented with local prototype images and source labels.

## Detail Page Structure

1. Photo gallery
   - A horizontal image strip at the top of the detail content.
   - Each photo has a source label such as `场所公开图`, `用户活动图`, `商家图`, or `平台实拍`.
   - Images may represent the venue, dishes, atmosphere, or prior activity moments.

2. Key facts
   - Time, area, venue, headcount, and estimated spend.
   - These facts should be visible before rules.

3. AI activity attraction summary
   - A natural 80-120 Chinese character paragraph.
   - It summarizes why the venue is worth visiting, why it fits the activity type, who should join, and whether the vibe, food, location, and spend match.
   - This must be prose, not a row of simple tags.

4. Venue credibility and atmosphere
   - Short proof points such as `大众点评静安日料热门榜前列`, `小红书多人收藏`, or `适合 4-6 人安静聊天`.
   - These remain local mock labels in the prototype.

5. Dishes and experience highlights
   - 3 compact cards for dishes, drinks, or experience details.
   - Dinner activities should show dish-oriented cards; coffee/bar/walk activities can show drinks, route, or atmosphere.

6. Location and spend
   - Area, venue, meeting point or transit hint, and estimated per-person spend.
   - Free activities explicitly show `免费`.

7. Participants preview
   - Existing participant preview remains, but appears after activity appeal content.

8. Rules and registration
   - AA, cancellation, and privacy rules remain.
   - The registration/waitlist CTA stays at the bottom of the detail flow.

## Data Model

Extend `Activity` with:

- `gallery`: local image URL, alt text, and source label.
- `attractionSummary`: the AI-written long-form attraction paragraph.
- `venueProofs`: short credibility/atmosphere proof points.
- `experienceHighlights`: compact dish or experience cards.
- `locationGuide`: transit or meeting-point text.

## Visual Direction

Keep the current warm mobile visual style. The detail page should feel more like a curated activity card than a contract page. Cards stay compact, text remains readable on 390px mobile width, and the CTA should not be hidden behind the bottom tab bar.

## Testing

Add regression tests that opening the sushi detail page shows:

- A photo gallery with source labels.
- The AI attraction paragraph.
- Restaurant credibility content.
- Dish highlights.
- Location and estimated spend.

Also test a non-dinner activity to ensure the same detail structure works beyond restaurants.
