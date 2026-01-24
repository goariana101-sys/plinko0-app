/* ===============================
   ROBO ARENA CHATBOT (FIXED)
=============================== */

const chatBubble = document.getElementById("chatbotBubble");
const chatWindow = document.getElementById("chatbotWindow");
const chatClose = document.getElementById("chatClose");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");

// ---------- SHOW CHAT AFTER LOADING ----------
window.addEventListener("load", () => {
    setTimeout(() => {
        chatBubble.style.display = "flex";
    }, 2000); // wait till installer ends
});

// ---------- OPEN CHAT ----------
chatBubble.onclick = () => {
    chatWindow.classList.remove("hidden");
    chatBubble.style.display = "none";

    if (chatMessages.innerHTML === "") {
        botMessage("Hi 👋 I’m ArenaBot. How can I help?");
    }
};

// ---------- CLOSE CHAT ----------
chatClose.onclick = () => {
    chatWindow.classList.add("hidden");
    chatBubble.style.display = "flex";
};

// ---------- DRAG BUBBLE ----------
let dragging = false, offsetX, offsetY;

chatBubble.addEventListener("touchstart", e => {
    dragging = true;
    const t = e.touches[0];
    offsetX = t.clientX - chatBubble.offsetLeft;
    offsetY = t.clientY - chatBubble.offsetTop;
});

document.addEventListener("touchmove", e => {
    if (!dragging) return;
    const t = e.touches[0];
    chatBubble.style.left = (t.clientX - offsetX) + "px";
    chatBubble.style.top = (t.clientY - offsetY) + "px";
});

document.addEventListener("touchend", () => dragging = false);

// ---------- MESSAGES ----------
function botMessage(text) {
    chatMessages.innerHTML += `<div><b>Bot:</b> ${text}</div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendChat() {
    if (!chatInput.value.trim()) return;
    chatMessages.innerHTML += `<div><b>You:</b> ${chatInput.value}</div>`;
    chatInput.value = "";
    botMessage("Thanks! Click *Talk to Agent* for live support.");
}

// ---------- LIVE AGENT ----------
async function requestLiveAgent() {
    botMessage("Connecting you to an agent... ⏳");

    if (typeof sendTelegramNotification === "function") {
        sendTelegramNotification("🆘 New user wants live support.");
    }

    const ref = await firebase.firestore().collection("supportChats").add({
        status: "waiting",
        time: Date.now()
    });

    setTimeout(async () => {
        const snap = await ref.get();
        if (snap.exists && snap.data().status === "waiting") {
            botMessage(
                "Sorry for the late response. All agents are busy right now. " +
                "They will contact you through your provided contact. Thanks 🙏"
            );
        }
    }, 60000);
}