const axios = require('axios');
const validUrl = require('valid-url');
const fs = require('fs');
const path = require('path');
const ytSearch = require('yt-search');
const { v4: uuidv4 } = require('uuid');

const API_ENDPOINT = "https://shizuai.vercel.app/chat";
const CLEAR_ENDPOINT = "https://shizuai.vercel.app/chat/clear";
const YT_API = "http://65.109.80.126:20409/aryan/yx";
const EDIT_API = "https://gemini-edit-omega.vercel.app/edit";

const TMP_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

// 📥 Téléchargement de fichier
const downloadFile = async (url, ext) => {
  const filePath = path.join(TMP_DIR, `${uuidv4()}.${ext}`);
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(filePath, Buffer.from(response.data));
  return filePath;
};

// ♻️ Réinitialiser la conversation
const resetConversation = async (api, event, message) => {
  api.setMessageReaction("♻️", event.messageID, () => {}, true);
  try {
    await axios.delete(`${CLEAR_ENDPOINT}/${event.senderID}`);
    return message.reply(`✅ Conversation reset for UID: ${event.senderID}`);
  } catch (error) {
    console.error('❌ Reset Error:', error.message);
    return message.reply("❌ Reset failed. Try again.");
  }
};

// 🎨 Fonction Edit (Gemini-Edit)
const handleEdit = async (api, event, message, args) => {
  const prompt = args.join(" ");
  if (!prompt) return message.reply("❗ Please provide text to edit or generate.");

  api.setMessageReaction("⏳", event.messageID, () => {}, true);
  try {
    const params = { prompt };
    if (event.messageReply?.attachments?.[0]?.url) {
      params.imgurl = event.messageReply.attachments[0].url;
    }

    const res = await axios.get(EDIT_API, { params });

    if (!res.data?.images?.[0]) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("❌ Failed to generate or edit image.");
    }

    const base64Image = res.data.images[0].replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Image, "base64");

    const imagePath = path.join(TMP_DIR, `${Date.now()}.png`);
    fs.writeFileSync(imagePath, buffer);

    api.setMessageReaction("✅", event.messageID, () => {}, true);
    await message.reply({ attachment: fs.createReadStream(imagePath) });
    fs.unlinkSync(imagePath);
  } catch (error) {
    console.error("❌ EDIT API Error:", error.response?.data || error.message);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    return message.reply("⚠️ Error while generating/editing image.");
  }
};

// 🎬 Fonction YouTube
const handleYouTube = async (api, event, message, args) => {
  const option = args[0];
  if (!["-v", "-a"].includes(option)) {
    return message.reply("❌ Usage: youtube [-v|-a] <search or URL>");
  }

  const query = args.slice(1).join(" ");
  if (!query) return message.reply("❌ Provide a search query or URL.");

  const sendFile = async (url, type) => {
    try {
      const { data } = await axios.get(`${YT_API}?url=${encodeURIComponent(url)}&type=${type}`);
      const downloadUrl = data.download_url;
      if (!data.status || !downloadUrl) throw new Error("API failed");
      const filePath = path.join(TMP_DIR, `yt_${Date.now()}.${type}`);
      const writer = fs.createWriteStream(filePath);
      const stream = await axios({ url: downloadUrl, responseType: "stream" });
      stream.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
      await message.reply({ attachment: fs.createReadStream(filePath) });
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`${type} error:`, err.message);
      message.reply(`❌ Failed to download ${type}.`);
    }
  };

  if (query.startsWith("http")) return await sendFile(query, option === "-v" ? "mp4" : "mp3");

  try {
    const results = (await ytSearch(query)).videos.slice(0, 6);
    if (results.length === 0) return message.reply("❌ No results found.");

    let list = "";
    results.forEach((v, i) => {
      list += `${i + 1}. 🎬 ${v.title} (${v.timestamp})\n`;
    });

    const thumbs = await Promise.all(
      results.map(v => axios.get(v.thumbnail, { responseType: "stream" }).then(res => res.data))
    );

    api.sendMessage(
      { body: list + "\nReply with number (1-6) to download.", attachment: thumbs },
      event.threadID,
      (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "ai",
          messageID: info.messageID,
          author: event.senderID,
          results,
          type: option
        });
      },
      event.messageID
    );
  } catch (err) {
    console.error("YouTube error:", err.message);
    message.reply("❌ Failed to search YouTube.");
  }
};

// 🧠 Fonction IA principale
const handleAIRequest = async (api, event, userInput, message, isReply = false) => {
  const args = userInput.split(" ");
  const
