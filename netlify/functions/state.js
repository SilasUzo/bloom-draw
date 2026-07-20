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
    return resp(200, {
      initialized: false,
      totalSlots: null,
      remaining: null,
      currentTurn: null,
      upNext: [],
      history: [],
    });
  }

  const allSorted = [...state.entries].sort((a, b) => a.number - b.number);
  const pending = allSorted.filter((e) => (e.status || "pending") !== "done");
  const done = allSorted.filter((e) => (e.status || "pending") === "done");

  const currentEntry = pending[0] || null;
  const currentTurn = currentEntry
    ? {
        name: currentEntry.name,
        flower: currentEntry.flower,
        number: currentEntry.number,
        bankName: currentEntry.bankName || "",
        accountNumber: currentEntry.accountNumber || "",
        accountName: currentEntry.accountName || "",
        hasBankDetails: Boolean(currentEntry.bankName || currentEntry.accountNumber),
      }
    : null;

  const upNext = pending.slice(1).map(({ name, flower, number }) => ({ name, flower, number }));

  const history = done.map(({ name, flower, number, doneAt }) => ({ name, flower, number, doneAt }));

  return resp(200, {
    initialized: true,
    totalSlots: state.totalSlots,
    remaining: state.availableNumbers.length,
    currentTurn,
    upNext,
    history,
  });
};
