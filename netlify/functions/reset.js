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

  const store = getStore(STORE_NAME);
  await store.delete(STATE_KEY);

  return resp(200, { ok: true });
};
