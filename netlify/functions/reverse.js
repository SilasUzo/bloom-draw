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

  const adminPasscode = process.env.ADMIN_PASSCODE;
  if (!adminPasscode) {
    return resp(500, { error: "No ADMIN_PASSCODE is configured on this site yet." });
  }
  if (body.passcode !== adminPasscode) {
    return resp(401, { error: "Incorrect passcode." });
  }

  const store = getBlobStore();
  const state = await store.get(STATE_KEY, { type: "json" });
  if (!state) {
    return resp(409, { error: "This draw hasn't been set up yet." });
  }
  if (state.entries.length === 0) {
    return resp(409, { error: "No one has planted an entry yet." });
  }

  const stillPending = state.entries.filter((e) => (e.status || "pending") !== "done");
  if (stillPending.length > 0) {
    return resp(409, {
      error: `The round isn't finished yet. ${stillPending.length} ${stillPending.length === 1 ? "person hasn't" : "people haven't"} collected.`,
    });
  }

  const totalSlots = state.totalSlots;
  for (const entry of state.entries) {
    entry.number = totalSlots + 1 - entry.number;
    entry.status = "pending";
    entry.doneAt = null;
  }

  await store.setJSON(STATE_KEY, state);

  return resp(200, { ok: true, totalSlots });
};
