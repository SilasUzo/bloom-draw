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

  const number = parseInt(body.number, 10);
  const undo = Boolean(body.undo);
  if (!Number.isFinite(number)) {
    return resp(400, { error: "Missing or invalid entry number." });
  }

  const store = getBlobStore();
  const state = await store.get(STATE_KEY, { type: "json" });
  if (!state) {
    return resp(409, { error: "This draw hasn't been set up yet." });
  }

  const entry = state.entries.find((e) => e.number === number);
  if (!entry) {
    return resp(404, { error: `No entry found with number ${number}.` });
  }

  entry.status = undo ? "pending" : "done";
  entry.doneAt = undo ? null : Date.now();

  await store.setJSON(STATE_KEY, state);

  return resp(200, { ok: true, number, status: entry.status });
};
