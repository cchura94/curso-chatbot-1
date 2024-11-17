const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const fs = require("fs")

async function conectarConWhatsapp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(
        "connection closed due to ",
        lastDisconnect.error,
        ", reconnecting ",
        shouldReconnect
      );
      // reconnect if not logged out
      if (shouldReconnect) {
        conectarConWhatsapp();
      }
    } else if (connection === "open") {
      console.log("CONEXION ABIERTA");
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    console.log(JSON.stringify(m, undefined, 2));
    if (m.type == "notify") {
      const id = m.messages[0].key.remoteJid;
      const nombre = m.messages[0].pushName;
      const mensaje =
        m.messages[0].message?.conversation ||
        m.messages[0].message?.text ||
        m.messages[0].message?.extendedTextMessage;

      if (id.includes("@s.whatsapp.net")) {
        console.log("EL USUARIO: " + nombre + " dice: " + mensaje);

        const key = {
          remoteJid: id,
          id: m.messages[0].key?.id,
        };

        // lectura de mensajes
        await sock.readMessages([key]);
        // estado whatsapp
        await sleep(200);
        await sock.sendPresenceUpdate("composing", id);

        await sleep(2000);

        await sock.sendMessage(id, { text: "Hola desde mi BOT" });

        await sleep(500);
        const sentMsg = await sock.sendMessage(id, {
          text: "@12345678901",
          mentions: ["12345678901@s.whatsapp.net"],
        });

        // send a location!
        const sentMsg2 = await sock.sendMessage(id, {
          location: {
            degreesLatitude: 24.121231,
            degreesLongitude: 55.1121221,
          },
        });

        // send a contact!
        const vcard =
          "BEGIN:VCARD\n" + // metadata of the contact card
          "VERSION:3.0\n" +
          "FN:Cristian\n" + // full name
          "ORG:Mi Empresa;\n" + // the organization of the contact
          "TEL;type=CELL;type=VOICE;waid=911234567890:+91 12345 67890\n" + // WhatsApp ID + phone number
          "END:VCARD";

        const sentMsg3 = await sock.sendMessage(id, {
          contacts: {
            displayName: "Cristian",
            contacts: [{ vcard }],
          },
        });

        // reacciones
        const reactionMessage = {
          react: {
            text: "💖", // use an empty string to remove the reaction
            key: m.messages[0].key,
          },
        };

        const sendMsg = await sock.sendMessage(id, reactionMessage);

        // mensaje con vista previa de urls
        const sentMsgURL = await sock.sendMessage(id, {
          text: "Hola, visita mi página: https://github.com/adiwajshing/baileys",
        });

        // enviar mensaje Imagen

        await sock.sendMessage(id, {
          image: {
            url: "https://www.mikeelectronica.com/cdn/shop/articles/B-MK_02_2121x.progressive.jpg?v=1607535378",
          },
        });

        // enviar mensaje Imagen con texto

        await sock.sendMessage(id, {
          image: {
            url: "https://www.mikeelectronica.com/cdn/shop/articles/B-MK_02_2121x.progressive.jpg?v=1607535378",
          },
          caption: `
            ¡Hola! 👋

Espero que estés bien. 😊 Quería comentarte sobre un Curso de Desarrollo Web que estoy organizando. Si te interesa aprender a crear páginas web, este curso te enseñará desde lo más básico hasta conceptos más avanzados como HTML, CSS, JavaScript, y herramientas modernas como React y Node.js.

El curso está diseñado para que puedas avanzar a tu propio ritmo, y cuenta con acceso a material exclusivo y prácticas en vivo.

Si tienes alguna duda o te gustaría obtener más detalles, no dudes en preguntar.

¡Estoy seguro de que te va a encantar! 💻✨
> Saludos desde mi Empresa 
> Google.com
            `,
        });

        // enviar gif
        await sock.sendMessage(
            id, 
            { 
                video: fs.readFileSync("Media/ma_gif.mp4"), 
                gifPlayback: true
            }
        )

        // enviar Video
        await sock.sendMessage(
            id, 
            { 
                video: fs.readFileSync("Media/ma_gif.mp4"), 
                gifPlayback: false
            }
        )

        // enviar Video con descripción
        await sock.sendMessage(
            id, 
            { 
                video: fs.readFileSync("Media/ma_gif.mp4"), 
                caption: `
                ¡Hola! 👋
    
    Espero que estés bien. 😊 Quería comentarte sobre un Curso de Desarrollo Web que estoy organizando. Si te interesa aprender a crear páginas web, este curso te enseñará desde lo más básico hasta conceptos más avanzados como HTML, CSS, JavaScript, y herramientas modernas como React y Node.js.
    
    El curso está diseñado para que puedas avanzar a tu propio ritmo, y cuenta con acceso a material exclusivo y prácticas en vivo.
    
    Si tienes alguna duda o te gustaría obtener más detalles, no dudes en preguntar.
    
    ¡Estoy seguro de que te va a encantar! 💻✨
    > Saludos desde mi Empresa 
    > Google.com
                `,
                gifPlayback: false,
                ptv: true
            }
        )

        await sock.sendMessage(
            id, 
            { audio: { url: "./Media/sonata.mp3" }, mimetype: 'audio/mp4', ptt: true }
            
            // { url: "Media/audio.mp3" }, // can send mp3, mp4, & ogg
        )

        // await sock.sendMessage(m.messages[0].key.remoteJid, { text: 'Hello there!' })
      } else {
        console.log("LLEGO MENSAJE EN UN GRUPO");
      }
    }
  });
}

conectarConWhatsapp();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
