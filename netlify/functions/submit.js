const { getStore } = require("@netlify/blobs");

const STORE_NAME = "bloom-scheme";
const STATE_KEY = "state";

function getBlobStore() {
  const siteID = process.env.BLOBS_SITE_ID;
  const token = process.env.BLOBS_TOKEN;
  if (siteID && token) {
    return getStore({ name: STORE_NAME, siteID, token });
  }
  return getStore(STORE_NAME);
}

function resp(status, body) {
  return {
    statusCode: status,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sortedEntries(state) {
  return [...state.entries]
    .sort((a, b) => a.number - b.number)
    .map(({ name, flower, number, ts }) => ({ name, flower, number, ts }));
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return resp(405, { error: "Method not allowed." });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return resp(400, { error: "Invalid request." });
  }

  const name = (body.name || "").trim();
  const flower = (body.flower || "").trim();
  const requestedSlots = parseInt(body.totalSlots, 10);

  if (!name || !flower) {
    return resp(400, { error: "Please provide both a name and a flower." });
  }
  if (name.length > 60 || flower.length > 40) {
    return resp(400, { error: "Name or flower is too long." });
  }

  const store = getBlobStore();
  let state = await store.get(STATE_KEY, { type: "json" });

  if (!state) {
    const slots = Number.isFinite(requestedSlots) && requestedSlots >= 2 ? Math.min(requestedSlots, 100) : 8;
    state = {
      totalSlots: slots,
      availableNumbers: shuffle(Array.from({ length: slots }, (_, i) => i + 1)),
      entries: [],
    };
  }

  const key = name.toLowerCase();
  const existing = state.entries.find((e) => e.key === key);
  if (existing) {
    return resp(200, {
      number: existing.number,
      alreadySubmitted: true,
      totalSlots: state.totalSlots,
      remaining: state.availableNumbers.length,
      entries: sortedEntries(state),
    });
  }

  if (state.availableNumbers.length === 0) {
    return resp(409, {
      error: "All numbers have already been claimed for this draw.",
      entries: sortedEntries(state),
    });
  }

  const idx = Math.floor(Math.random() * state.availableNumbers.length);
  const number = state.availableNumbers.splice(idx, 1)[0];
  state.entries.push({ key, name, flower, number, ts: Date.now() });

  await store.setJSON(STATE_KEY, state);

  return resp(200, {
    number,
    alreadySubmitted: false,
    totalSlots: state.totalSlots,
    remaining: state.availableNumbers.length,
    entries: sortedEntries(state),
  });
};
