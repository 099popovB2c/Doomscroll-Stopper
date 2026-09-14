# Doomscroll Stopper

A privacy-first Chrome extension that sets daily content-view limits for social feeds.

## v1.2.0

- Added a live **Today's Usage** dashboard for all supported feeds.
- Shows current count, daily limit, progress and emergency-break usage per platform.
- Keeps the stable fingerprint counting and SPA-aware tracking introduced in v1.1.0.

## v1.1.0

- Replaced DOM-node-only counting with stable post/video fingerprints where available.
- Daily seen-item fingerprints are stored locally and capped, reducing duplicate counts after DOM recycling or reloads.
- Fixed YouTube Shorts SPA navigation so entering Shorts without a full page reload can start tracking.
- Removed `ytd-shorts` container counting; Shorts are counted as individual reel video renderers.
- Debounced mutation work to reduce repeated storage reads and limit checks.
- Added configurable **Emergency breaks/day** (1–5), default 1.
- Daily reset now clears counters, break usage and seen-item history.
- Added extension icons.
- Replaced the abbreviated license with the full MIT License.

## Supported feeds

- X
- Reddit
- YouTube Shorts
- Instagram
- Facebook

## How counting works

An item is counted only after at least 60% of it enters the viewport. When possible the extension derives a stable fingerprint from the platform's post/video ID or permalink. If a stable ID is unavailable, it falls back to a local content fingerprint. Seen fingerprints stay local and reset daily.

## Limits

Balanced defaults: X 100, Reddit 80, YouTube Shorts 30, Instagram 80, Facebook 80, with one 5-minute emergency break per site/day. Strict preset uses 40/30/10/30/30 and disables the emergency break.

## Privacy

No backend and no external API. The extension does not transmit credentials, cookies, authentication tokens, post contents, usernames, private messages or browsing history. Settings use Chrome sync storage; counters, fingerprints and break state use local extension storage.

## Notes

Social platforms change their DOM frequently. Selectors and stable-ID extraction may require maintenance in later releases. Limits are user-configured productivity controls, not platform limits or medical recommendations.
