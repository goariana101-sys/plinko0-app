/* Telegram Notification System */
const TELEGRAM_BOT_TOKEN = '8526007970:AAEg0JqfDrdmdcn_5FysowgKuwER3Ifvx-I';
const TELEGRAM_CHAT_ID = '874563737';

async function sendTelegramNotification(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const data = {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
    };

    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error('Telegram notification failed:', error);
    }
}
