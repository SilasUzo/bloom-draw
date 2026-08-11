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

  const numberA = parseInt(body.numberA, 10);
  const numberB = parseInt(body.numberB, 10);
  if (!Number.isFinite(numberA) || !Number.isFinite(numberB)) {
    return resp(400, { error: "Enter both numbers to swap." });
  }
  if (numberA === numberB) {
    return resp(400, { error: "Those are the same number." });
  }

  const store = getBlobStore();
  const state = await store.get(STATE_KEY, { type: "json" });
  if (!state) {
    return resp(409, { error: "This draw hasn't been set up yet." });
  }

  const entryA = state.entries.find((e) => e.number === numberA);
  const entryB = state.entries.find((e) => e.number === numberB);

  if (!entryA || !entryB) {
    return resp(404, {
      error: `Could not find both entries. Number ${numberA}: ${entryA ? "found" : "not found"}. Number ${numberB}: ${entryB ? "found" : "not found"}.`,
    });
  }

  entryA.number = numberB;
  entryB.number = numberA;

  await store.setJSON(STATE_KEY, state);

  return resp(200, {
    ok: true,
    swapped: [
      { name: entryA.name, number: entryA.number },
      { name: entryB.name, number: entryB.number },
    ],
  });
};
