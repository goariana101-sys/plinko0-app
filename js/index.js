/* ===== PREMIUM LOADING SCREEN ENGINE ===== */
document.addEventListener("DOMContentLoaded", () => {

    if(localStorage.getItem("installer_done")) {
        document.getElementById("installerScreen")?.remove();
        return;
    }

    const steps = [
        "Configuring system...",
        "Database configuration...",
        "Jackpot installing...",
        "Multiplier installing...",
        "Peg setting configured...",
        "Bonus packaging...",
        "Loading AI modules...",
        "Installing game engine...",
        "Securing network...",
        "Finalizing setup..."
    ];

    const textEl = document.getElementById("installerText");
    const barEl = document.getElementById("progressFill");
    const percentEl = document.getElementById("progressPercent");
    const stepSound = document.getElementById("stepSound");
    const completeSound = document.getElementById("completeSound");

    let step = 0;

    document.body.style.overflow = "hidden";

    const runStep = () => {
        if(step >= steps.length){
            barEl.style.width = "100%";
            percentEl.textContent = "100";
            completeSound?.play().catch(()=>{});

            setTimeout(() => {
                const installer = document.getElementById("installerScreen");
                installer.style.transition = "opacity 0.6s";
                installer.style.opacity = 0;
                setTimeout(()=>{
                    installer.remove();
                    document.body.style.overflow = "auto";
                    localStorage.setItem("installer_done","yes");
                },600);
            },800);
            return;
        }

        // Fade in step
        textEl.style.opacity = 0;
        setTimeout(() => {
            textEl.textContent = steps[step];
            textEl.style.opacity = 1;

            stepSound?.play().catch(()=>{});

            const percent = Math.floor(((step+1)/steps.length)*100);
            barEl.style.width = percent + "%";
            percentEl.textContent = percent;

            step++;
            setTimeout(runStep, 1200);
        }, 400);
    };

    runStep();
});

/* ============================
   PREMIUM INSTALLER ENGINE
============================ */
document.addEventListener("DOMContentLoaded", () => {

    const installer = document.getElementById("installerScreen");
    const message = document.getElementById("installMessages");
    const bar = document.getElementById("loaderProgress");
    const percent = document.getElementById("percentCount");

    const bootSound = document.getElementById("installSound");
    const tickSound = document.getElementById("tickSound");

    const steps = [
        "Configuring system…",
        "Database configuration…",
        "Jackpot installing…",
        "Multiplier installing…",
        "Peg setting configured…",
        "Bonus packaging…",
        "Loading AI modules…",
        "Installing game engine…",
        "Securing network…",
        "Checking user network…",
        "Finalizing setup…"
    ];

    let currentStep = 0;
    let progress = 0;

    document.body.style.overflow = "hidden";

    // Play boot sound
    bootSound.volume = 0.6;
    bootSound.play().catch(()=>{});

    const runInstaller = () => {

        if (currentStep < steps.length) {
            message.textContent = steps[currentStep];

            progress += Math.floor(100 / steps.length);
            bar.style.width = progress + "%";
            percent.textContent = progress;

            tickSound.currentTime = 0;
            tickSound.volume = 0.3;
            tickSound.play().catch(()=>{});

            currentStep++;
            setTimeout(runInstaller, 900);

        } else {
            bar.style.width = "100%";
            percent.textContent = "100";

            setTimeout(() => {
                installer.style.display = "none";
                document.body.style.overflow = "auto";
            }, 1000);
        }
    };

    runInstaller();
});





/* ================================
   GLOBAL SAFETY RESET
================================ */
document.body.style.pointerEvents = "auto";


    /* ================================
       MODAL CONTROL (LOGIN / REGISTER)
    ================================ */
    window.openModal = function (id) {
        const modal = document.getElementById(id);
        if (!modal) return;

        modal.style.display = "flex";
        document.body.classList.add("modal-open");
    };

    window.closeModal = function (id) {
        const modal = document.getElementById(id);
        if (!modal) return;

        modal.style.display = "none";
        document.body.classList.remove("modal-open");
    };

    /* ================================
       INSTALLER / LOADING SCREEN
    ================================ */
  document.addEventListener("DOMContentLoaded", () => {
    const installer = document.getElementById("installerScreen");
    const installText = document.getElementById("installMessages");
    const progressDots = document.getElementById("progressDots");

    if (installer && installText && progressDots) {
        const steps = [
            "Initializing core modules",
            "Configuring Arena Engine",
            "Loading AI referee",
            "Installing reward system",
            "Securing player vault",
            "Finalizing setup"
        ];

        let stepIndex = 0;

        const installerInterval = setInterval(() => {
            installText.textContent = steps[stepIndex] || "Setup complete";
            progressDots.textContent = ".".repeat((stepIndex % 3) + 1);
            stepIndex++;

            if (stepIndex > steps.length) {
                clearInterval(installerInterval);

                setTimeout(() => {
                    installer.style.opacity = "0";

                    setTimeout(() => {
                        installer.remove(); // 🔥 THIS FIXES BUTTON CLICKS
                        document.body.style.pointerEvents = "auto";
                    }, 600);

                }, 800);
            }
        }, 700);
    }

    /* ================================
       CHATBOT FLOAT BUTTON
    ================================ */
    const botBtn = document.getElementById("chatBotBtn");
    const botWindow = document.getElementById("chatBotWindow");
    const botClose = document.getElementById("chatBotClose");
    const botMessages = document.getElementById("chatBotMessages");
    const botInput = document.getElementById("chatBotInput");

    if (botBtn && botWindow) {

        botBtn.style.display = "flex";

        botBtn.addEventListener("click", () => {
            botWindow.style.display = "flex";
            botBtn.style.display = "none";

            addBotMessage("Hello 👋 I’m ArenaBot. Ask me anything.");
        });

        if (botClose) {
            botClose.addEventListener("click", () => {
                botWindow.style.display = "none";
                botBtn.style.display = "flex"; // 🔥 FIX: button returns
            });
        }

        if (botInput) {
            botInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && botInput.value.trim()) {
                    addUserMessage(botInput.value);
                    autoBotReply(botInput.value);
                    botInput.value = "";
                }
            });
        }
    }

    /* ================================
       CHATBOT MESSAGE HELPERS
    ================================ */
    function addBotMessage(text) {
        const msg = document.createElement("div");
        msg.className = "bot-msg";
        msg.textContent = text;
        botMessages.appendChild(msg);
        botMessages.scrollTop = botMessages.scrollHeight;
    }

    function addUserMessage(text) {
        const msg = document.createElement("div");
        msg.className = "user-msg";
        msg.textContent = text;
        botMessages.appendChild(msg);
        botMessages.scrollTop = botMessages.scrollHeight;
    }

    function autoBotReply(userText) {
        setTimeout(() => {
            let reply = "I can help with accounts, deposits, withdrawals, and gameplay.";

            if (userText.toLowerCase().includes("withdraw")) {
                reply = "Withdrawals are processed instantly after approval.";
            }
            if (userText.toLowerCase().includes("login")) {
                reply = "Click MEMBER LOGIN to access your account.";
            }
            if (userText.toLowerCase().includes("agent")) {
                reply = "Live agents are currently offline. Please leave your question.";
            }

            addBotMessage(reply);
        }, 700);
    }

});


/* ================================
   INSTALLER SEQUENCE
================================ */
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('installerOverlay');
    const bar = document.getElementById('installerProgress');
    const status = document.getElementById('installerStatus');

    const steps = [
        { text: 'Configuring environment...', progress: 15 },
        { text: 'Loading game engine...', progress: 35 },
        { text: 'Installing winning packages...', progress: 55 },
        { text: 'Securing user session...', progress: 75 },
        { text: 'Finalizing setup...', progress: 95 },
        { text: 'Ready', progress: 100 }
    ];

    let step = 0;

    const runInstaller = () => {
        if (step >= steps.length) {
            setTimeout(() => {
                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'none';
                setTimeout(() => overlay.remove(), 600);
            }, 600);
            return;
        }

        status.textContent = steps[step].text;
        bar.style.width = steps[step].progress + '%';
        step++;

        setTimeout(runInstaller, 700);
    };

    runInstaller();
});

/* ===============================
   INSTALLER BOOT SEQUENCE
================================ */
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('installerOverlay');
    const bar = document.getElementById('installerProgress');
    const status = document.getElementById('installerStatus');
    const sound = document.getElementById('installerSound');

    if (!overlay) return;

    try { sound?.play(); } catch(e){}

    const steps = [
        { t: 'Configuring environment...', p: 12 },
        { t: 'Loading game engine...', p: 30 },
        { t: 'Installing reward modules...', p: 48 },
        { t: 'Encrypting user session...', p: 66 },
        { t: 'Optimizing performance...', p: 82 },
        { t: 'Finalizing setup...', p: 100 }
    ];

    let i = 0;

    const nextStep = () => {
        if (i >= steps.length) {
            setTimeout(() => {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity .6s ease';
                setTimeout(() => overlay.remove(), 700);
            }, 800);
            return;
        }

        status.textContent = steps[i].t;
        bar.style.width = steps[i].p + '%';
        i++;

        setTimeout(nextStep, 750);
    };

    nextStep();
});