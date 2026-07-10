const form = document.getElementById("entry-form");
const nameInput = document.getElementById("name");
const flowerInput = document.getElementById("flower");
const setupNote = document.getElementById("setup-note");
const submitBtn = document.getElementById("submit-btn");
const formError = document.getElementById("form-error");

const resultBox = document.getElementById("result");
const resultNumber = document.getElementById("result-number");
const resultName = document.getElementById("result-name");
const resultNote = document.getElementById("result-note");

const gardenList = document.getElementById("garden-list");
const gardenEmpty = document.getElementById("garden-empty");
const gardenCount = document.getElementById("garden-count");

const resetToggle = document.getElementById("reset-toggle");
const resetBox = document.getElementById("reset-box");
const resetPasscode = document.getElementById("reset-passcode");
const resetBtn = document.getElementById("reset-btn");
const resetMsg = document.getElementById("reset-msg");

const setupToggle = document.getElementById("setup-toggle");
const setupBox = document.getElementById("setup-box");
const setupSlots = document.getElementById("setup-slots");
const setupPasscode = document.getElementById("setup-passcode");
const setupBtn = document.getElementById("setup-btn");
const setupMsg = document.getElementById("setup-msg");

const LOCAL_KEY = "bloom-draw-mine";

function showError(msg) {
  formError.textContent = msg;
  formError.classList.remove("hidden");
}
function clearError() {
  formError.classList.add("hidden");
  formError.textContent = "";
}

function renderGarden(entries, totalSlots, remaining) {
  gardenList.innerHTML = "";
  if (!entries || entries.length === 0) {
    gardenEmpty.classList.remove("hidden");
  } else {
    gardenEmpty.classList.add("hidden");
    for (const e of entries) {
      const li = document.createElement("li");
      li.className = "garden-card";
      li.innerHTML = `
        <div class="garden-badge">${e.number}</div>
        <div class="garden-info">
          <p class="garden-name">${escapeHtml(e.name)}</p>
          <p class="garden-flower">${escapeHtml(e.flower)}</p>
        </div>`;
      gardenList.appendChild(li);
    }
  }
  if (totalSlots) {
    gardenCount.textContent = `${entries.length} of ${totalSlots} planted`;
  } else {
    gardenCount.textContent = "";
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function refreshState() {
  try {
    const res = await fetch("/api/state");
    const data = await res.json();
    renderGarden(data.entries, data.totalSlots, data.remaining);
    if (!data.initialized) {
      setupNote.classList.remove("hidden");
      submitBtn.disabled = true;
    } else {
      setupNote.classList.add("hidden");
      submitBtn.disabled = false;
    }
  } catch (err) {
    // Silent fail on background refresh; the form still works on submit.
  }
}

function showResult(number, name, note) {
  resultNumber.textContent = number;
  resultName.textContent = name;
  resultNote.textContent = note || "";
  resultBox.classList.remove("hidden");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const name = nameInput.value.trim();
  const flower = flowerInput.value.trim();
  if (!name || !flower) {
    showError("Please fill in both your name and your flower.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Drawing...";

  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, flower }),
    });
    const data = await res.json();

    if (!res.ok) {
      showError(data.error || "Something went wrong. Please try again.");
      if (data.entries) renderGarden(data.entries, data.totalSlots, data.remaining);
      return;
    }

    localStorage.setItem(LOCAL_KEY, JSON.stringify({ name, flower, number: data.number }));

    showResult(
      data.number,
      `${name} — ${flower}`,
      data.alreadySubmitted
        ? "You'd already planted this entry, so here's your number again."
        : "Your spot is saved. Numbers are drawn at random, so this is truly yours."
    );

    renderGarden(data.entries, data.totalSlots, data.remaining);
    setupNote.classList.add("hidden");
    form.reset();
  } catch (err) {
    showError("Couldn't reach the garden. Check your connection and try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Draw my number";
  }
});

setupToggle.addEventListener("click", () => {
  setupBox.classList.toggle("hidden");
  resetBox.classList.add("hidden");
});

setupBtn.addEventListener("click", async () => {
  const passcode = setupPasscode.value;
  const totalSlots = parseInt(setupSlots.value, 10);
  if (!passcode) {
    setupMsg.textContent = "Enter the organizer passcode.";
    return;
  }
  if (!Number.isFinite(totalSlots) || totalSlots < 2) {
    setupMsg.textContent = "Enter how many friends are in the draw (2 or more).";
    return;
  }
  setupMsg.textContent = "Opening the draw...";
  try {
    const res = await fetch("/api/init", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode, totalSlots }),
    });
    const data = await res.json();
    if (!res.ok) {
      setupMsg.textContent = data.error || "Could not set up the draw.";
      return;
    }
    setupMsg.textContent = `Draw opened for ${data.totalSlots} friends. Share the link now.`;
    setupPasscode.value = "";
    await refreshState();
  } catch (err) {
    setupMsg.textContent = "Couldn't reach the garden.";
  }
});

resetToggle.addEventListener("click", () => {
  resetBox.classList.toggle("hidden");
  setupBox.classList.add("hidden");
});

resetBtn.addEventListener("click", async () => {
  const passcode = resetPasscode.value;
  if (!passcode) {
    resetMsg.textContent = "Enter the organizer passcode first.";
    return;
  }
  resetMsg.textContent = "Clearing...";
  try {
    const res = await fetch("/api/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    const data = await res.json();
    if (!res.ok) {
      resetMsg.textContent = data.error || "Could not reset.";
      return;
    }
    resetMsg.textContent = "Draw cleared. Everyone can plant a fresh entry.";
    localStorage.removeItem(LOCAL_KEY);
    resultBox.classList.add("hidden");
    resetPasscode.value = "";
    await refreshState();
  } catch (err) {
    resetMsg.textContent = "Couldn't reach the garden.";
  }
});

// Restore this visitor's own result if they've already submitted on this device.
const mine = localStorage.getItem(LOCAL_KEY);
if (mine) {
  try {
    const parsed = JSON.parse(mine);
    showResult(parsed.number, `${parsed.name} — ${parsed.flower}`, "This is the number you already drew on this device.");
  } catch {}
}

refreshState();
setInterval(refreshState, 6000);
