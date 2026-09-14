const DEFAULTS = {
  enabled: true,
  xLimit: 100,
  redditLimit: 80,
  youtubeShortsLimit: 30,
  instagramLimit: 80,
  facebookLimit: 80,
  allowFiveMinuteBreak: true,
  maxBreaksPerDay: 1
};

const BALANCED = { ...DEFAULTS };
const STRICT = {
  enabled: true,
  xLimit: 40,
  redditLimit: 30,
  youtubeShortsLimit: 10,
  instagramLimit: 30,
  facebookLimit: 30,
  allowFiveMinuteBreak: false,
  maxBreaksPerDay: 1
};

const numericIds = ["xLimit", "redditLimit", "youtubeShortsLimit", "instagramLimit", "facebookLimit"];
const $ = id => document.getElementById(id);

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function renderUsageSummary(settings) {
  const sites = [
    ["x", "X", "xLimit"],
    ["reddit", "Reddit", "redditLimit"],
    ["youtubeShorts", "Shorts", "youtubeShortsLimit"],
    ["instagram", "Instagram", "instagramLimit"],
    ["facebook", "Facebook", "facebookLimit"]
  ];
  const keys = [];
  for (const [key] of sites) keys.push(`dss_${key}_date`, `dss_${key}_count`, `dss_${key}_breaksUsed`);
  const local = await chrome.storage.local.get(keys);
  const today = todayKey();
  const parts = sites.map(([key, label, limitKey]) => {
    const activeToday = local[`dss_${key}_date`] === today;
    const count = activeToday ? Number(local[`dss_${key}_count`] || 0) : 0;
    const breaks = activeToday ? Number(local[`dss_${key}_breaksUsed`] || 0) : 0;
    const limit = Math.max(1, Number(settings[limitKey] || DEFAULTS[limitKey]));
    const pct = Math.min(100, Math.round((count / limit) * 100));
    return `${label}: ${count}/${limit} (${pct}%)${breaks ? `, breaks ${breaks}` : ""}`;
  });
  $("usageSummary").innerHTML = parts.join("<br>");
}

async function render() {
  const settings = await chrome.storage.sync.get(DEFAULTS);
  $("enabled").checked = Boolean(settings.enabled);
  $("allowFiveMinuteBreak").checked = Boolean(settings.allowFiveMinuteBreak);
  $("maxBreaksPerDay").value = String(Math.max(1, Math.min(5, Number(settings.maxBreaksPerDay || 1))));
  $("breakLimitRow").classList.toggle("disabled-row", !settings.allowFiveMinuteBreak);
  for (const id of numericIds) $(id).value = String(settings[id]);
  await renderUsageSummary(settings);
}

function flash(message) {
  $("status").textContent = message;
  clearTimeout(flash.timer);
  flash.timer = setTimeout(() => { $("status").textContent = "Settings save automatically."; }, 1000);
}

async function save(id, value) {
  await chrome.storage.sync.set({ [id]: value });
  flash("Saved.");
}

$("enabled").addEventListener("change", e => { save("enabled", e.target.checked).catch(() => {}); });
$("allowFiveMinuteBreak").addEventListener("change", async e => { await save("allowFiveMinuteBreak", e.target.checked); await render(); });
$("maxBreaksPerDay").addEventListener("change", e => {
  const value = Math.max(1, Math.min(5, Number(e.target.value) || 1));
  e.target.value = String(value);
  save("maxBreaksPerDay", value).catch(() => {});
});

for (const id of numericIds) {
  $(id).addEventListener("change", e => {
    const value = Math.max(1, Math.min(5000, Number(e.target.value) || DEFAULTS[id]));
    e.target.value = String(value);
    save(id, value).then(render).catch(() => {});
  });
}

$("balancedPreset").addEventListener("click", async () => { await chrome.storage.sync.set(BALANCED); await render(); flash("Balanced preset applied."); });
$("strictPreset").addEventListener("click", async () => { await chrome.storage.sync.set(STRICT); await render(); flash("Strict preset applied."); });

$("resetToday").addEventListener("click", async () => {
  const ok = window.confirm("Reset today's counters, seen-item history and emergency breaks for all supported sites?");
  if (!ok) return;
  const prefixes = ["x", "reddit", "youtubeShorts", "instagram", "facebook"];
  const update = {};
  for (const key of prefixes) {
    update[`dss_${key}_date`] = "";
    update[`dss_${key}_count`] = 0;
    update[`dss_${key}_snoozeUntil`] = 0;
    update[`dss_${key}_breaksUsed`] = 0;
    update[`dss_${key}_seenFingerprints`] = [];
  }
  await chrome.storage.local.set(update);
  await render();
  flash("Today's tracking data reset.");
});

render().catch(() => {});
setInterval(() => render().catch(() => {}), 5000);
