# Facebook Crossposting Deferred

## Status

Deferred as of June 29, 2026.

PulseToob currently has reader share buttons, but it does not have automatic Facebook Page publishing enabled. Keep Facebook Page tokens out of Git and out of the frontend.

## Target Page

- Facebook Page URL: `https://web.facebook.com/profile.php?id=61580384150892`
- Page ID: `61580384150892`

## Planned Behavior

- Allow admins/editors to post a published article link to the PulseToob Facebook Page.
- Store Facebook post status per article in `Article.customFields.socialPosts.facebook`.
- Prevent accidental duplicate posts, with an explicit repost confirmation.
- Show admin states such as `Post FB`, `Retry FB`, and `Facebook posted`.

## Implementation Areas When Enabled

When this feature is picked back up, expect work in:

- A new backend Facebook service for Meta Graph API calls.
- `backend/controllers/articleController.js`
- `backend/routes/articles.js`
- `frontend/src/app/admin/articles/page.tsx`
- `frontend/src/types/cms.ts`

## Required Render Environment Variables

```env
FACEBOOK_PAGE_ID=61580384150892
FACEBOOK_PAGE_ACCESS_TOKEN=your_facebook_page_access_token
FACEBOOK_APP_SECRET=optional_meta_app_secret_for_appsecret_proof
FACEBOOK_GRAPH_VERSION=v24.0
```

## Notes Before Enabling

- Use a Facebook Page access token with the required Meta permissions for Page publishing.
- Test with one low-risk article first.
- Consider adding a queue/retry worker before posting automatically on publish.
- Do not auto-crosspost every article until the editorial workflow is stable.
