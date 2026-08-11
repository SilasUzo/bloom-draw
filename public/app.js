const form = document.getElementById("entry-form");
const nameInput = document.getElementById("name");
const flowerInput = document.getElementById("flower");
const bankNameInput = document.getElementById("bankName");
const accountNumberInput = document.getElementById("accountNumber");
const accountNameInput = document.getElementById("accountName");
const setupNote = document.getElementById("setup-note");
const submitBtn = document.getElementById("submit-btn");
const formError = document.getElementById("form-error");

const resultBox = document.getElementById("result");
const resultNumber = document.getElementById("result-number");
const resultName = document.getElementById("result-name");
const resultNote = document.getElementById("result-note");

const gardenCount = document.getElementById("garden-count");
const gardenEmpty = document.getElementById("garden-empty");
const allDoneNote = document.getElementById("all-done-note");

const currentTurnCard = document.getElementById("current-turn-card");
const currentName = document.getElementById("current-name");
const currentFlower = document.getElementById("current-flower");
const currentBank = document.getElementById("current-bank");
const currentBankName = document.getElementById("current-bank-name");
const currentAccountNumber = document.getElementById("current-account-number");
const currentAccountName = document.getElementById("current-account-name");
const currentAccountNameRow = document.getElementById("current-account-name-row");
const currentNoBank = document.getElementById("current-no-bank");

const upNextSection = document.getElementById("up-next-section");
const gardenList = document.getElementById("garden-list");

const historyToggle = document.getElementById("history-toggle");
const historySection = document.getElementById("history-section");
const historyList = document.getElementById("history-list");

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

const markdoneToggle = document.getElementById("markdone-toggle");
const markdoneBox = document.getElementById("markdone-box");
const markdoneNumber = document.getElementById("markdone-number");
const markdonePasscode = document.getElementById("markdone-passcode");
const markdoneBtn = document.getElementById("markdone-btn");
const markdoneMsg = document.getElementById("markdone-msg");

const swapToggle = document.getElementById("swap-toggle");
const swapBox = document.getElementById("swap-box");
const swapNumberA = document.getElementById("swap-number-a");
const swapNumberB = document.getElementById("swap-number-b");
const swapPasscode = document.getElementById("swap-passcode");
const swapBtn = document.getElementById("swap-btn");
const swapMsg = document.getElementById("swap-msg");

const reverseToggle = document.getElementById("reverse-toggle");
const reverseBox = document.getElementById("reverse-box");
const reversePasscode = document.getElementById("reverse-passcode");
const reverseBtn = document.getElementById("reverse-btn");
const reverseMsg = document.getElementById("reverse-msg");

const LOCAL_KEY = "bloom-draw-mine";

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showError(msg) {
  formError.textContent = msg;
  formError.classList.remove("hidden");
}
function clearError() {
  formError.classList.add("hidden");
  formError.textContent = "";
}

function showResult(number, name, note) {
  resultNumber.textContent = number;
  resultName.textContent = name;
  resultNote.textContent = note || "";
  resultBox.classList.remove("hidden");
}

function renderDashboard(data) {
  const { totalSlots, currentTurn, upNext, history } = data;
  const totalPlanted = (currentTurn ? 1 : 0) + upNext.length + history.length;

  gardenCount.textContent = totalSlots ? `${totalPlanted} of ${totalSlots} planted` : "";

  if (currentTurn) {
    currentTurnCard.classList.remove("hidden");
    allDoneNote.classList.add("hidden");
    currentFlower.textContent = currentTurn.flower;
    currentName.textContent = `#${currentTurn.number} — ${currentTurn.name}`;
    if (currentTurn.hasBankDetails) {
      currentBank.classList.remove("hidden");
      currentNoBank.classList.add("hidden");
      currentBankName.textContent = currentTurn.bankName || "—";
      currentAccountNumber.textContent = currentTurn.accountNumber || "—";
      if (currentTurn.accountName) {
        currentAccountNameRow.classList.remove("hidden");
        currentAccountName.textContent = currentTurn.accountName;
      } else {
        currentAccountNameRow.classList.add("hidden");
      }
    } else {
      currentBank.classList.add("hidden");
      currentNoBank.classList.remove("hidden");
    }
  } else {
    currentTurnCard.classList.add("hidden");
    allDoneNote.classList.toggle("hidden", totalPlanted === 0);
  }

  gardenEmpty.classList.toggle("hidden", totalPlanted !== 0);

  gardenList.innerHTML = "";
  if (upNext.length > 0) {
    upNextSection.classList.remove("hidden");
    for (const e of upNext) {
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
  } else {
    upNextSection.classList.add("hidden");
  }

  historyList.innerHTML = "";
  if (history.length > 0) {
    historyToggle.classList.remove("hidden");
    for (const e of history) {
      const li = document.createElement("li");
      li.className = "garden-card";
      const dateStr = e.doneAt ? new Date(e.doneAt).toLocaleDateString() : "";
      li.innerHTML = `
        <div class="garden-badge">${e.number}</div>
        <div class="garden-info">
          <p class="garden-name">${escapeHtml(e.name)}</p>
          <p class="garden-flower">${escapeHtml(e.flower)} &middot; collected ${dateStr}</p>
        </div>`;
      historyList.appendChild(li);
    }
  } else {
    historyToggle.classList.add("hidden");
    historySection.classList.add("hidden");
  }
}

async function refreshState() {
  try {
    const res = await fetch("/api/state");
    const data = await res.json();
    renderDashboard(data);
    if (!data.initialized) {
      setupNote.classList.remove("hidden");
      submitBtn.disabled = true;
    } else {
      setupNote.classList.add("hidden");
      submitBtn.disabled = false;
    }
    reverseToggle.disabled = !data.roundComplete;
    reverseToggle.title = data.roundComplete
      ? "Flip everyone's number for a new round"
      : "Available once everyone has been marked done";
    if (!data.roundComplete) {
      reverseBox.classList.add("hidden");
    }
  } catch (err) {
    // Silent fail on background refresh; the form still works on submit.
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const name = nameInput.value.trim();
  const flower = flowerInput.value.trim();
  const bankName = bankNameInput.value.trim();
  const accountNumber = accountNumberInput.value.trim();
  const accountName = accountNameInput.value.trim();

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
      body: JSON.stringify({ name, flower, bankName, accountNumber, accountName }),
    });
    const data = await res.json();

    if (!res.ok) {
      showError(data.error || "Something went wrong. Please try again.");
      return;
    }

    localStorage.setItem(LOCAL_KEY, JSON.stringify({ name, flower, number: data.number }));

    let note;
    if (data.alreadySubmitted && data.bankUpdated) {
      note = "Your bank details were saved. Here's your number again.";
    } else if (data.alreadySubmitted) {
      note = "You'd already planted this entry, so here's your number again.";
    } else {
      note = "Your spot is saved. Numbers are drawn at random, so this is truly yours.";
    }
    showResult(data.number, `${name} — ${flower}`, note);

    setupNote.classList.add("hidden");
    form.reset();
    await refreshState();
  } catch (err) {
    showError("Couldn't reach the garden. Check your connection and try again.");
  } finally {
    submitBtn.disabled = false;
    updateSubmitLabel();
  }
});

historyToggle.addEventListener("click", () => {
  const isHidden = historySection.classList.toggle("hidden");
  historyToggle.textContent = isHidden ? "Show history" : "Hide history";
});

function closeAdminPanels(except) {
  for (const box of [setupBox, resetBox, markdoneBox, swapBox, reverseBox]) {
    if (box !== except) box.classList.add("hidden");
  }
}

setupToggle.addEventListener("click", () => {
  const willShow = setupBox.classList.contains("hidden");
  closeAdminPanels(willShow ? setupBox : null);
  setupBox.classList.toggle("hidden");
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
  const willShow = resetBox.classList.contains("hidden");
  closeAdminPanels(willShow ? resetBox : null);
  resetBox.classList.toggle("hidden");
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

markdoneToggle.addEventListener("click", () => {
  const willShow = markdoneBox.classList.contains("hidden");
  closeAdminPanels(willShow ? markdoneBox : null);
  markdoneBox.classList.toggle("hidden");
});

markdoneBtn.addEventListener("click", async () => {
  const passcode = markdonePasscode.value;
  const number = parseInt(markdoneNumber.value, 10);
  if (!passcode) {
    markdoneMsg.textContent = "Enter the organizer passcode.";
    return;
  }
  if (!Number.isFinite(number)) {
    markdoneMsg.textContent = "Enter the number to mark as collected.";
    return;
  }
  markdoneMsg.textContent = "Updating...";
  try {
    const res = await fetch("/api/markdone", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode, number }),
    });
    const data = await res.json();
    if (!res.ok) {
      markdoneMsg.textContent = data.error || "Could not update.";
      return;
    }
    markdoneMsg.textContent = `Number ${number} marked as collected.`;
    markdoneNumber.value = "";
    await refreshState();
  } catch (err) {
    markdoneMsg.textContent = "Couldn't reach the garden.";
  }
});

swapToggle.addEventListener("click", () => {
  const willShow = swapBox.classList.contains("hidden");
  closeAdminPanels(willShow ? swapBox : null);
  swapBox.classList.toggle("hidden");
});

swapBtn.addEventListener("click", async () => {
  const passcode = swapPasscode.value;
  const numberA = parseInt(swapNumberA.value, 10);
  const numberB = parseInt(swapNumberB.value, 10);
  if (!passcode) {
    swapMsg.textContent = "Enter the organizer passcode.";
    return;
  }
  if (!Number.isFinite(numberA) || !Number.isFinite(numberB)) {
    swapMsg.textContent = "Enter both numbers to swap.";
    return;
  }
  swapMsg.textContent = "Swapping...";
  try {
    const res = await fetch("/api/swap", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode, numberA, numberB }),
    });
    const data = await res.json();
    if (!res.ok) {
      swapMsg.textContent = data.error || "Could not swap.";
      return;
    }
    const [a, b] = data.swapped;
    swapMsg.textContent = `Swapped: ${a.name} is now #${a.number}, ${b.name} is now #${b.number}.`;
    swapNumberA.value = "";
    swapNumberB.value = "";
    await refreshState();
  } catch (err) {
    swapMsg.textContent = "Couldn't reach the garden.";
  }
});

reverseToggle.addEventListener("click", () => {
  const willShow = reverseBox.classList.contains("hidden");
  closeAdminPanels(willShow ? reverseBox : null);
  reverseBox.classList.toggle("hidden");
});

reverseBtn.addEventListener("click", async () => {
  const passcode = reversePasscode.value;
  if (!passcode) {
    reverseMsg.textContent = "Enter the organizer passcode.";
    return;
  }
  reverseMsg.textContent = "Reversing...";
  try {
    const res = await fetch("/api/reverse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    const data = await res.json();
    if (!res.ok) {
      reverseMsg.textContent = data.error || "Could not reverse the order.";
      return;
    }
    reverseMsg.textContent = "Order reversed. Round two has begun.";
    reversePasscode.value = "";
    localStorage.removeItem(LOCAL_KEY);
    resultBox.classList.add("hidden");
    await refreshState();
  } catch (err) {
    reverseMsg.textContent = "Couldn't reach the garden.";
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

function updateSubmitLabel() {
  const hasNumberOnThisDevice = Boolean(localStorage.getItem(LOCAL_KEY));
  const hasBankInput = Boolean(
    bankNameInput.value.trim() || accountNumberInput.value.trim() || accountNameInput.value.trim()
  );
  if (hasNumberOnThisDevice && hasBankInput) {
    submitBtn.textContent = "Save my details";
  } else {
    submitBtn.textContent = "Draw my number";
  }
}

for (const el of [bankNameInput, accountNumberInput, accountNameInput]) {
  el.addEventListener("input", updateSubmitLabel);
}
updateSubmitLabel();

refreshState();
setInterval(refreshState, 6000);
