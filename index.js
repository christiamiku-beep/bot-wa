const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Bot WhatsApp Aktif 24 Jam'));
app.listen(process.env.PORT || 3000, () => console.log('Web server siap'));

const nomorBot = "6281927585005";

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('sesi_bot');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.macOS("Desktop")
    });

    if (!sock.authState.creds.registered) {
        await delay(5000);
        const code = await sock.requestPairingCode(nomorBot);
        console.log('\n=========================================');
        console.log(`KODE PAIRING WA KAMU: ${code}`);
        console.log('=========================================\n');
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const teks = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const pengirim = msg.key.remoteJid;

        if (teks.toLowerCase() === 'ping') {
            await sock.sendMessage(pengirim, { text: 'Pong! Bot aktif 24 jam.' });
        } else if (teks.toLowerCase() === 'menu') {
            await sock.sendMessage(pengirim, { text: 'Halo! Bot WhatsApp 24 jam siap digunakan.\nKetik *ping* untuk cek status.' });
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'close') {
            startBot();
        } else if (connection === 'open') {
            console.log('Bot WhatsApp berhasil terhubung!');
        }
    });
}

startBot();
    
