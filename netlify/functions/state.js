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

exports.handler = async () => {
  const store = getBlobStore();
  const state = await store.get(STATE_KEY, { type: "json" });

  if (!state) {
    return resp(200, { initialized: false, totalSlots: null, remaining: null, entries: [] });
  }

  const entries = [...state.entries]
    .sort((a, b) => a.number - b.number)
    .map(({ name, flower, number, ts }) => ({ name, flower, number, ts }));

  return resp(200, {
    initialized: true,
    totalSlots: state.totalSlots,
    remaining: state.availableNumbers.length,
    entries,
  });
};
