# Doomscroll Stopper

A privacy-first Chrome extension that limits endless scrolling by counting feed items viewed on supported social platforms and hiding the feed when your daily limit is reached.

## Supported sites

- X / Twitter
- Reddit
- YouTube Shorts
- Instagram
- Facebook

## Features

- Set a separate daily content limit for each supported platform.
- Counts an item only after it is substantially visible on screen.
- Hides the feed once the configured limit is reached.
- Daily counters reset automatically on a new local calendar day.
- Optional **5-minute emergency break** after the limit is reached.
- Balanced and Strict presets.
- Manual reset for today's counters.
- Small on-page counter showing today's progress.
- No account required.
- No external API.
- No server or backend.

## Default limits

- X: 100 posts/day
- Reddit: 80 posts/day
- YouTube Shorts: 30 Shorts/day
- Instagram: 80 feed items/day
- Facebook: 80 feed items/day

These are user-configurable defaults, not medical or platform recommendations.

## Install

1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select this extension folder.
6. Open the popup and choose your daily limits.

## How counting works

The extension uses an `IntersectionObserver` to detect when a supported feed item is substantially visible in the viewport. Each DOM item is counted once per page session.

When the local daily counter reaches the configured limit, the feed is hidden and a limit screen is shown.

## Privacy

All counters and settings stay in the browser.

The extension does not collect or transmit:

- account credentials;
- cookies;
- authentication tokens;
- post contents;
- usernames;
- browsing history;
- private messages.

Settings use Chrome sync storage. Daily counters use local extension storage.

## Notes

Social platforms change their page structure regularly. Selectors may need maintenance over time.

## Disclaimer

This project is not affiliated with X, Reddit, YouTube, Instagram, Facebook, Meta, Google, or their respective owners.
