const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const QRCode = require('qrcode');

const app = express();
let qrTerbaru = '';

app.get('/', async (req, res) => {
    if (!qrTerbaru) return res.send('<h3>Bot aktif atau sedang menyiapkan QR Code... Refresh halaman ini dalam 5 detik.</h3>');
    const gambarQR = await QRCode.toDataURL(qrTerbaru);
    res.send(`<h2>Scan QR WhatsApp Ini:</h2><img src="${gambarQR}" style="width:300px;"/>`);
});

app.listen(process.env.PORT || 3000, () => console.log('Web server siap'));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('sesi_bot');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: Browsers.macOS("Desktop")
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (qr) qrTerbaru = qr;
        if (connection === 'close') {
            startBot();
        } else if (connection === 'open') {
            qrTerbaru = '';
            console.log('Bot WhatsApp berhasil terhubung!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const teks = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const pengirim = msg.key.remoteJid;

        if (teks.toLowerCase() === 'ping') {
            await sock.sendMessage(pengirim, { text: 'Pong! Bot aktif 24 jam.' });
        }
    });
}

startBot();
