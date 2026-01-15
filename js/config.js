/* Page Title: Firebase & Telegram Configuration */

// 1. Your Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAHkztGejStIi5rJFVJ7NO8IkVJJ2ByoE4",
    authDomain: "oja-odan-6fc94.firebaseapp.com",
    projectId: "oja-odan-6fc94",
    storageBucket: "oja-odan-6fc94.appspot.com",
    messagingSenderId: "1096739384978",
    appId: "1:1096739384978:web:4a79774605ace1e2cbc04b",
  measurementId: "G-Y48C843PEQ"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// 2. Enhanced Telegram Notification Function
async function sendTelegramNotification(type, data) {
    const botToken = "8526447970:AAEg0JqfDrdmUUE-5FysowgKuwER3Ifvx-I";
    const chatId = "874563737";
    
    let message = "";
    
    // Formatting based on event type
    if (type === "NEW_USER") {
        message = `🆕 *New User Registered*\n` +
                  `━━━━━━━━━━━━━━━\n` +
                  `👤 Name: ${data.name}\n` +
                  `📧 Email: ${data.email}\n` +
                  `💰 Initial Balance: $${data.balance}\n` +
                  `🔗 Referral: ${data.referral || "None"}`;
    } else if (type === "JACKPOT") {
        message = `🏆 *GRAND JACKPOT WINNER!* 🏆\n` +
                  `━━━━━━━━━━━━━━━\n` +
                  `👤 User: ${data.name}\n` +
                  `💰 Won: $10,000.00\n` +
                  `⚠️ Action: Awaiting Admin Approval`;
    } else {
        message = data; // Fallback for simple text messages
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}&parse_mode=Markdown`;
    
    try {
        await fetch(url);
    } catch (err) {
        console.error("Telegram notification failed:", err);
    }
}
