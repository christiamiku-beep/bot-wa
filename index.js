const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Bot WhatsApp Aktif 24 Jam!'));
app.listen(process.env.PORT || 3000, () => console.log('Web server siap'));

// GANTI NOMOR DI BAWAH INI DENGAN NOMOR WA BOT KAMU (Awali 62)
const nomorBot = "6281927585005";

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('sesi_bot');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!sock.authState.creds.registered) {
        await delay(3000);
        const code = await sock.requestPairingCode(nomorBot);
        console.log(`\n========================================`);
        console.log(`KODE PAIRING WA KAMU: ${code}`);
        console.log(`========================================\n`);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (text.toLowerCase() === 'ping') {
            await sock.sendMessage(sender, { text: 'Pong! Bot aktif terus meskipun WiFi mati.' });
        } else if (text.toLowerCase() === 'menu') {
            await sock.sendMessage(sender, { text: 'Halo! Ini menu bot WA:\n1. Ketik *ping* untuk cek status\n2. Ketik *info* untuk info bot' });
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'close') startBot();
        if (connection === 'open') console.log('Bot WhatsApp Berhasil Terhubung!');
    });
}

startBot();
              
