const DEFAULTS = {
  enabled: true,
  xLimit: 100,
  redditLimit: 80,
  youtubeShortsLimit: 30,
  instagramLimit: 80,
  facebookLimit: 80,
  allowFiveMinuteBreak: true
};

const BALANCED = {
  enabled: true,
  xLimit: 100,
  redditLimit: 80,
  youtubeShortsLimit: 30,
  instagramLimit: 80,
  facebookLimit: 80,
  allowFiveMinuteBreak: true
};

const STRICT = {
  enabled: true,
  xLimit: 40,
  redditLimit: 30,
  youtubeShortsLimit: 10,
  instagramLimit: 30,
  facebookLimit: 30,
  allowFiveMinuteBreak: false
};

const ids = Object.keys(DEFAULTS);
const numericIds = [
  "xLimit",
  "redditLimit",
  "youtubeShortsLimit",
  "instagramLimit",
  "facebookLimit"
];

const $ = id => document.getElementById(id);

async function render() {
  const settings = await chrome.storage.sync.get(DEFAULTS);

  $("enabled").checked = Boolean(settings.enabled);
  $("allowFiveMinuteBreak").checked = Boolean(settings.allowFiveMinuteBreak);

  for (const id of numericIds) {
    $(id).value = String(settings[id]);
  }
}

async function save(id, value) {
  await chrome.storage.sync.set({ [id]: value });
  $("status").textContent = "Saved.";
  setTimeout(() => {
    $("status").textContent = "Settings save automatically.";
  }, 900);
}

$("enabled").addEventListener("change", e => {
  save("enabled", e.target.checked).catch(() => {});
});

$("allowFiveMinuteBreak").addEventListener("change", e => {
  save("allowFiveMinuteBreak", e.target.checked).catch(() => {});
});

for (const id of numericIds) {
  $(id).addEventListener("change", e => {
    const value = Math.max(1, Math.min(5000, Number(e.target.value) || DEFAULTS[id]));
    e.target.value = String(value);
    save(id, value).catch(() => {});
  });
}

$("balancedPreset").addEventListener("click", async () => {
  await chrome.storage.sync.set(BALANCED);
  await render();
  $("status").textContent = "Balanced preset applied.";
});

$("strictPreset").addEventListener("click", async () => {
  await chrome.storage.sync.set(STRICT);
  await render();
  $("status").textContent = "Strict preset applied.";
});

$("resetToday").addEventListener("click", async () => {
  const ok = window.confirm("Reset today's doomscroll counters for all supported sites?");
  if (!ok) return;

  const prefixes = ["x", "reddit", "youtubeShorts", "instagram", "facebook"];
  const update = {};

  for (const key of prefixes) {
    update[`dss_${key}_date`] = "";
    update[`dss_${key}_count`] = 0;
    update[`dss_${key}_snoozeUntil`] = 0;
  }

  await chrome.storage.local.set(update);
  $("status").textContent = "Today's counters reset.";
});

render().catch(() => {});

