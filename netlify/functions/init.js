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

  const totalSlots = parseInt(body.totalSlots, 10);
  if (!Number.isFinite(totalSlots) || totalSlots < 2 || totalSlots > 200) {
    return resp(400, { error: "Enter a number of friends between 2 and 200." });
  }

  const store = getBlobStore();
  const existing = await store.get(STATE_KEY, { type: "json" });

  if (existing && existing.entries.length > 0) {
    return resp(409, {
      error: "People have already submitted entries. Use Organizer reset first if you want to change the size and start over.",
    });
  }

  const state = {
    totalSlots,
    availableNumbers: shuffle(Array.from({ length: totalSlots }, (_, i) => i + 1)),
    entries: [],
  };
  await store.setJSON(STATE_KEY, state);

  return resp(200, { ok: true, totalSlots });
};
