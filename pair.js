const express = require('express');
const fs = require('fs-extra');
const { exec } = require("child_process");
const router = express.Router();
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const crypto = require('crypto');

const MESSAGE = process.env.MESSAGE || `
🌹SESSION_𝐃𝐀𝐑𝐊 𝐐𝐔𝐄𝐄𝐍 𝐀𝐢🌹


🌹 Rejoins notre groupe WhatsApp officiel pour rester connecté:  
https://chat.whatsapp.com/Jj5TEAu0bDx3Nv6gugTxV2?mode=ems_copy_t

🌹 *Instructions :*  
1. Copie le session ID ci-dessus.
  
2. Colle-le dans le fichier *config.js*. 
 
3. Va sur : https://bot-hosting.net/?aff=1275118062533611654 le bot gratuitement.

 𝐃𝐞𝐯 𝐛𝐲 𝐁𝐥𝐚𝐜𝐤 𝐤𝐢𝐧𝐠 𝐥𝐞𝐨𝐧𝐢𝐝𝐚𝐬
`;

const { upload } = require('./mega');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason
} = require("@whiskeysockets/baileys");

// Clear auth directory at startup
if (fs.existsSync('./auth_info_baileys')) {
    fs.emptyDirSync('./auth_info_baileys');
}

router.get('/', async (req, res) => {
    let num = req.query.number;

    async function SUHAIL() {
        const { state, saveCreds } = await useMultiFileAuthState(`./auth_info_baileys`);

        try {
            const Smd = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.macOS("Safari"),
            });

            if (!Smd.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await Smd.requestPairingCode(num);
                if (!res.headersSent) await res.send({ code });
            }

            Smd.ev.on('creds.update', saveCreds);

            Smd.ev.on("connection.update", async (update) => {
                const { connection, lastDisconnect } = update;

                if (connection === "open") {
                await Smd.newsletterFollow("120363338949058824@newsletter")
                    try {
                        await delay(10000);

                        const auth_path = './auth_info_baileys/';
                        const user = Smd.user.id;

                        // Random Mega ID generator
                        function randomMegaId(length = 6, numberLength = 4) {
                            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                            let result = '';
                            for (let i = 0; i < length; i++) {
                                result += characters.charAt(Math.floor(Math.random() * characters.length));
                            }
                            const number = Math.floor(Math.random() * Math.pow(10, numberLength));
                            return `${result}${number}`;
                        }

                        // Upload creds.json to Mega
                        const mega_url = await upload(fs.createReadStream(auth_path + 'creds.json'), `${randomMegaId()}.json`);
                        
                        // Extraire fileID et key en toute sécurité
                        let fileID, key;
                        if (mega_url.includes('#')) {
                            const parts = mega_url.split('/file/')[1].split('#');
                            fileID = parts[0];
                            key = parts[1];
                        } else {
                            fileID = mega_url.split('/file/')[1];
                            key = crypto.randomBytes(32).toString('base64'); // fallback
                        }

                        // Construire la session avec préfixe kaya~
                        const sessionString = `blackking~${fileID}#${key}`;

                        // Envoyer la session à l’utilisateur
                        const msgsss = await Smd.sendMessage(user, { text: sessionString });
                        await Smd.sendMessage(user, { text: MESSAGE }, { quoted: msgsss });

                        await delay(1000);
                        await fs.emptyDir(auth_path);

                    } catch (e) {
                        console.log("Error during upload or send:", e);
                    }
                }

                if (connection === "close") {
                    const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
                    if ([DisconnectReason.connectionClosed, DisconnectReason.connectionLost, DisconnectReason.restartRequired, DisconnectReason.timedOut].includes(reason)) {
                        console.log("Reconnecting...");
                        SUHAIL().catch(console.log);
                    } else {
                        console.log('Connection closed unexpectedly:', reason);
                        await delay(5000);
                        exec('pm2 restart qasim');
                    }
                }
            });

        } catch (err) {
            console.log("Error in SUHAIL function:", err);
            exec('pm2 restart qasim');
            SUHAIL();
            await fs.emptyDir('./auth_info_baileys');
            if (!res.headersSent) await res.send({ code: "Try After Few Minutes" });
        }
    }

    await SUHAIL();
});

module.exports = router;
