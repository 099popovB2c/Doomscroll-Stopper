(() => {
  if (window.__doomscrollStopperLoaded) return;
  window.__doomscrollStopperLoaded = true;

  const DEFAULTS = {
    enabled: true,
    xLimit: 100,
    redditLimit: 80,
    youtubeShortsLimit: 30,
    instagramLimit: 80,
    facebookLimit: 80,
    allowFiveMinuteBreak: true
  };

  const SITE_CONFIG = {
    x: {
      label: "X",
      limitKey: "xLimit",
      selectors: ['article[data-testid="tweet"]']
    },
    reddit: {
      label: "Reddit",
      limitKey: "redditLimit",
      selectors: [
        'shreddit-post',
        'article[data-testid="post-container"]',
        'div[data-testid="post-container"]'
      ]
    },
    youtubeShorts: {
      label: "YouTube Shorts",
      limitKey: "youtubeShortsLimit",
      selectors: [
        'ytd-reel-video-renderer',
        'ytd-shorts'
      ]
    },
    instagram: {
      label: "Instagram",
      limitKey: "instagramLimit",
      selectors: ['main article']
    },
    facebook: {
      label: "Facebook",
      limitKey: "facebookLimit",
      selectors: [
        'div[role="feed"] div[role="article"]',
        'div[role="article"]'
      ]
    }
  };

  let settings = { ...DEFAULTS };
  let siteKey = detectSite();
  let observer = null;
  let intersectionObserver = null;
  let blocked = false;
  const seen = new WeakSet();

  function detectSite() {
    const host = location.hostname;
    const path = location.pathname;

    if (host === "x.com" || host === "twitter.com") return "x";
    if (host === "www.reddit.com") return "reddit";
    if (host === "www.youtube.com" && path.startsWith("/shorts")) return "youtubeShorts";
    if (host === "www.instagram.com") return "instagram";
    if (host === "www.facebook.com") return "facebook";
    return null;
  }

  function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function storageKeys() {
    return siteKey
      ? {
          date: `dss_${siteKey}_date`,
          count: `dss_${siteKey}_count`,
          snoozeUntil: `dss_${siteKey}_snoozeUntil`
        }
      : null;
  }

  async function getCount() {
    if (!siteKey) return 0;
    const keys = storageKeys();
    const stored = await chrome.storage.local.get([
      keys.date,
      keys.count,
      keys.snoozeUntil
    ]);

    if (stored[keys.date] !== todayKey()) {
      await chrome.storage.local.set({
        [keys.date]: todayKey(),
        [keys.count]: 0,
        [keys.snoozeUntil]: 0
      });
      return 0;
    }

    return Number(stored[keys.count] || 0);
  }

  async function incrementCount() {
    const keys = storageKeys();
    const count = await getCount();
    const next = count + 1;

    await chrome.storage.local.set({
      [keys.date]: todayKey(),
      [keys.count]: next
    });

    updateBadge(next);
    await checkLimit(next);
  }

  async function isSnoozed() {
    if (!siteKey) return false;
    const keys = storageKeys();
    const stored = await chrome.storage.local.get([keys.snoozeUntil]);
    return Number(stored[keys.snoozeUntil] || 0) > Date.now();
  }

  function currentLimit() {
    if (!siteKey) return Infinity;
    const config = SITE_CONFIG[siteKey];
    return Math.max(1, Number(settings[config.limitKey] || 1));
  }

  function updateBadge(count) {
    let badge = document.getElementById("dss-counter-badge");

    if (!badge) {
      badge = document.createElement("div");
      badge.id = "dss-counter-badge";
      document.documentElement.appendChild(badge);
    }

    const config = SITE_CONFIG[siteKey];
    badge.textContent = `${config.label}: ${count}/${currentLimit()}`;
  }

  function feedRoots() {
    switch (siteKey) {
      case "x":
        return [...document.querySelectorAll('main[role="main"]')];
      case "reddit":
        return [...document.querySelectorAll("main")];
      case "youtubeShorts":
        return [...document.querySelectorAll("ytd-shorts, #shorts-container")];
      case "instagram":
        return [...document.querySelectorAll("main")];
      case "facebook":
        return [...document.querySelectorAll('div[role="feed"]')];
      default:
        return [];
    }
  }

  function setFeedBlocked(isBlocked) {
    for (const root of feedRoots()) {
      root.classList.toggle("dss-feed-blocked", isBlocked);
    }
  }

  async function blockFeed(count) {
    if (blocked) return;
    if (await isSnoozed()) return;

    blocked = true;
    setFeedBlocked(true);

    const overlay = document.createElement("div");
    overlay.id = "dss-limit-overlay";

    const card = document.createElement("div");
    card.className = "dss-card";

    const title = document.createElement("h2");
    title.textContent = "Daily feed limit reached";

    const body = document.createElement("p");
    body.textContent =
      `You have viewed ${count} items on ${SITE_CONFIG[siteKey].label} today. ` +
      `Your current daily limit is ${currentLimit()}.`;

    const hint = document.createElement("p");
    hint.className = "dss-muted";
    hint.textContent =
      "The feed is hidden until tomorrow or until you change the limit in the extension.";

    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(hint);

    if (settings.allowFiveMinuteBreak) {
      const button = document.createElement("button");
      button.textContent = "Allow 5 more minutes";
      button.addEventListener("click", async () => {
        const keys = storageKeys();
        await chrome.storage.local.set({
          [keys.snoozeUntil]: Date.now() + 5 * 60 * 1000
        });
        blocked = false;
        setFeedBlocked(false);
        overlay.remove();

        setTimeout(() => {
          checkLimit().catch(() => {});
        }, 5 * 60 * 1000 + 500);
      });
      card.appendChild(button);
    }

    overlay.appendChild(card);
    document.documentElement.appendChild(overlay);
  }

  async function checkLimit(forcedCount = null) {
    if (!settings.enabled || !siteKey) {
      setFeedBlocked(false);
      document.getElementById("dss-limit-overlay")?.remove();
      blocked = false;
      return;
    }

    if (await isSnoozed()) return;

    const count = forcedCount ?? await getCount();
    updateBadge(count);

    if (count >= currentLimit()) {
      await blockFeed(count);
    }
  }

  function uniqueItems() {
    if (!siteKey) return [];
    const selectors = SITE_CONFIG[siteKey].selectors;
    return [...document.querySelectorAll(selectors.join(","))];
  }

  function observeItems() {
    if (!intersectionObserver) {
      intersectionObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (entry.intersectionRatio < 0.6) continue;
          if (seen.has(entry.target)) continue;

          seen.add(entry.target);
          intersectionObserver.unobserve(entry.target);
          incrementCount().catch(() => {});
        }
      }, {
        threshold: [0.6]
      });
    }

    for (const item of uniqueItems()) {
      if (!seen.has(item)) intersectionObserver.observe(item);
    }
  }

  function startObservers() {
    observeItems();

    observer = new MutationObserver(() => {
      siteKey = detectSite();
      observeItems();
      checkLimit().catch(() => {});
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true
    });
  }

  async function loadSettings() {
    const stored = await chrome.storage.sync.get(DEFAULTS);
    settings = { ...DEFAULTS, ...stored };
    siteKey = detectSite();

    if (!siteKey) return;

    updateBadge(await getCount());
    await checkLimit();
    startObservers();
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;

    for (const [key, change] of Object.entries(changes)) {
      settings[key] = change.newValue;
    }

    checkLimit().catch(() => {});
  });

  window.addEventListener("popstate", () => {
    siteKey = detectSite();
    setTimeout(() => {
      observeItems();
      checkLimit().catch(() => {});
    }, 300);
  });

  loadSettings().catch(() => {});
})();

