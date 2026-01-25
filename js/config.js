/* Page Title: Firebase & Telegram Configuration */

// 1. Your Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyA83osiC8R4QEnvgM78l3gnNpZacR0zkHM",
    authDomain: "robo-123fb.firebaseapp.com",
    projectId: "robo-123fb",
    storageBucket: "robo-123fb.firebasestorage.app",
    messagingSenderId: "555715595228",
    appId: "1:555715595228:web:f3b323fdda8312f6aa1d19",
    measurementId: "G-5GVCLE2JH0"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Global variables for all other scripts to use
window.db = firebase.firestore();
window.auth = firebase.auth();

// 2. Enhanced Telegram Notification Function
async function sendTelegramNotification(type, data) {
    const botToken = "8526447970:AAEg0JqfDrdmUUE-5FysowgKuwER3Ifvx-I";
    const chatId = "874563737";
    
    let message = "";
    
    if (type === "NEW_USER") {
        message = `🆕 <b>New User Registered</b>\n` +
                  `━━━━━━━━━━━━━━━\n` +
                  `👤 Name: ${data.name}\n` +
                  `📧 Email: ${data.email}\n` +
                  `💰 Initial Balance: $${data.balance}\n` +
                  `🔗 Referred By: ${data.referral || "Direct Signup"}`;
    } else if (type === "JACKPOT") {
        message = `🏆 <b>GRAND JACKPOT WINNER!</b> 🏆\n` +
                  `━━━━━━━━━━━━━━━\n` +
                  `👤 User: ${data.name}\n` +
                  `💰 Won: $95,000.00`;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (e) { console.error("Telegram error:", e); }
}
