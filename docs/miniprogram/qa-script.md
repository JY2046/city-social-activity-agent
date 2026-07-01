# Mini Program First Release QA Script

This script covers the cold-start Mini Program MVP before internal trial release. Run it in WeChat Developer Tools first, then on at least one iOS WeChat device and one Android WeChat device.

## Test Matrix

| Environment | Required |
| --- | --- |
| WeChat Developer Tools | Yes |
| iOS WeChat device | Yes |
| Android WeChat device | Yes |
| Normal participant role | Yes |
| JuZhang role | Yes |
| Paid activity | Yes |
| Free activity | Yes |
| Full activity waitlist | Yes |
| JuZhang waitlist | Yes |

## Visual Baseline

Check every page at common mobile widths and real devices:

- No text overlaps with buttons, chips, tabs, cards, or bottom areas.
- Main CTA text stays on one line.
- Search and filter controls are not oversized.
- Bottom navigation does not dominate the screen.
- Activity card tags do not overlap.
- Long AI recommendation copy remains readable and does not overflow.
- Pages can scroll to all bottom actions.
- Dark pages and light pages feel intentional, not like an accidental theme jump.

## 1. Launch And Login

1. Open the Mini Program in WeChat Developer Tools.
2. Confirm the app opens on Discover.
3. Trigger login wrapper through the first user action that needs identity.
4. Confirm a server-issued user identity is stored.
5. Confirm no raw `openid` appears in UI logs or user-facing state.
6. Confirm denied profile permission falls back gracefully to default profile display.

Expected result:

- User can continue using public browsing without a broken login state.
- Signup-required actions ask for identity only when needed.

## 2. Discover Page

1. Open `pages/discover/index`.
2. Confirm the first viewport shows city, date/time, product headline, search, filters, and main activity card.
3. Confirm the main activity card shows image, type, status, headcount, title, venue, time, cost, CTA, and AI recommendation.
4. Scroll through activity list.
5. Confirm paid and free activities both display correct cost labels.
6. Confirm full activities show a waitlist-oriented CTA.
7. Confirm trust strip is visible and not embedded awkwardly inside activity cards.

Expected result:

- Discover feels like a polished mobile activity feed.
- No visual overlap on iOS or Android.

## 3. Activity Detail

1. Open `pages/activity-detail/index?activityId=a-sushi`.
2. Confirm title card shows type, title, location, time, headcount, status, and cost.
3. Confirm public photos appear directly below the title card.
4. Confirm `种草理由` is a paragraph, not just tags.
5. Confirm activity highlights show dish/place/activity details.
6. Confirm location guide and AA rule are visible.
7. Confirm bottom actions include returning to activity home and signup.
8. Share the page and confirm share path includes `activityId`.

Expected result:

- Detail page provides enough context for a stranger to decide whether to join.
- Public photos render from local Mini Program assets.

## 4. Signup

1. Open `pages/signup/index?activityId=a-coffee`.
2. Confirm signup button is disabled until rules are accepted.
3. Accept rules without selecting JuZhang willingness.
4. Tap confirm signup.
5. Confirm success state says ordinary signup is complete.
6. Confirm “查看局长任务” does not appear.
7. Reset state, select JuZhang willingness, and submit again.
8. Confirm JuZhang task entry appears only after opt-in.
9. Confirm subscription permission can be requested after signup.

Expected result:

- Ordinary users are not pushed into JuZhang flow.
- JuZhang opt-in is explicit and low-pressure.

## 5. Waitlist

1. Open `pages/waitlist/index?activityId=a-bar&type=activity`.
2. Join activity waitlist.
3. Confirm queue state and queue position are shown.
4. Open `pages/waitlist/index?activityId=a-sushi&type=juZhang`.
5. Join JuZhang waitlist.
6. Confirm copy clearly says this is JuZhang candidate queue, not activity signup.
7. Confirm subscription permission can be requested after joining waitlist.

Expected result:

- Full activity waitlist and JuZhang waitlist are visually and conceptually separate.

## 6. Itinerary

1. Open `pages/itinerary/index?activityId=a-coffee`.
2. Confirm title, time, venue, and cost are visible.
3. Tap “我会准时到”.
4. Confirm the label stays on one line.
5. Tap “可能迟到” and “无法到场”.
6. Confirm state changes are visible and not clipped.
7. Tap “申请局长”.
8. Confirm state changes to “局长排队中”.
9. Tap payment confirmation.
10. Confirm ordinary participant sees payment completion state.
11. Confirm free activity shows “本活动免费”.
12. Confirm there is a return-to-detail entry.

Expected result:

- Ordinary participants can handle arrival and payment state without seeing JuZhang-only controls.

## 7. JuZhang Workspace

1. Open `pages/juzhang/index?activityId=a-sushi`.
2. Confirm Hero copy and AI reminder do not overlap.
3. Tap accept JuZhang.
4. Confirm state changes to accepted.
5. Tap decline.
6. Confirm decline does not remove activity participation.
7. Confirm task cards show:
   - 开场 & 破冰
   - 活动中协调
   - AA 结算确认
8. Confirm AI topic card is visible and readable.
9. Confirm participant arrival rows are visible.
10. Confirm JuZhang can mark participant arrived.
11. Confirm AA rows show each participant payment state.
12. Confirm JuZhang can confirm participant payment.
13. Confirm page scrolls to activity-after feedback entry.

Expected result:

- JuZhang workspace is operational but does not feel like a heavy-duty admin console.

## 8. Feedback And Mutual Selection

1. Open `pages/feedback/index?activityId=a-sushi`.
2. Select one participant.
3. Submit feedback.
4. Confirm state says feedback submitted.
5. Simulate mutual selection through service test or debug data.
6. Confirm state becomes “已互选，可开放联系”.
7. Add abnormal feedback text.
8. Submit again.
9. Confirm abnormal text is stored and does not appear publicly as contact content.

Expected result:

- Contact opens only after mutual selection.
- Abnormal feedback remains a safety/ops signal.

## 9. Profile

1. Open `pages/profile/index`.
2. Confirm trust level label appears without raw score.
3. Confirm attended activity count can be described as visible or hidden.
4. Confirm current itinerary entry can be reached.

Expected result:

- Profile supports trust context without exposing raw scoring.

## 10. Content And Privacy Checks

1. Confirm no private contact information appears before activity completion.
2. Confirm mutual selection rule appears in relevant flows.
3. Confirm user text fields have length limits.
4. Confirm uploaded or public photos have source labels.
5. Confirm privacy policy copy exists before release submission.
6. Confirm activity safety copy exists for night/alcohol-adjacent activities.

Expected result:

- The product is safe enough for a closed beta with curated activities.

## 11. Release Candidate

Before submitting an internal trial version:

- [ ] Run this script in WeChat Developer Tools.
- [ ] Run this script on iOS WeChat.
- [ ] Run this script on Android WeChat.
- [ ] Verify AppID is production or intended trial AppID.
- [ ] Verify cloud environment points to trial/prod, not local mock.
- [ ] Verify subscription template ids are real.
- [ ] Verify privacy policy is configured in the Mini Program admin console.
- [ ] Verify content review and admin removal path are available.
- [ ] Verify payment remains offline/pay-to-merchant only.
- [ ] Verify seed activities are in Shanghai and manually reviewed.

## Known V1 Limits

- No full chat.
- No public activity creation.
- No platform-held payments.
- No real-time map tracking.
- No user-uploaded activity feed outside reviewed activity photos.
