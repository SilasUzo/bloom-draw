const { getStore } = require("@netlify/blobs");

const STORE_NAME = "bloom-scheme";
const STATE_KEY = "state";

function resp(status, body) {
  return {
    statusCode: status,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

exports.handler = async () => {
  const store = getStore(STORE_NAME);
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
