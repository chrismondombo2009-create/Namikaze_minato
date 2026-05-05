const axios = require('axios'); 
const request = require('request'); 
const fs = require("fs"); 

module.exports = { 
    config: { 
        name: "box", 
        aliases: ["box"], 
        version: "1.0", 
        author: "MILAN", 
        countDown: 5, 
        role: 1, 
        shortDescription: "set admin/change group photo,emoji,name", 
        longDescription: "", 
        category: "admin", 
        guide: { 
            vi: "{pn} [admin,emoji,image,name]", 
            en: "{pn} name <name> to change box name\n{pn} emoji <emoji> to change box emoji\n{pn} image <reply to image> to change box image\n{pn} add [@tag] to add group admin\n{pn} del [@tag] to remove group admin\n{pn} info to see group info"
        }
    }, 
    onStart: async function ({ message, api, event, args, getText }) { 
        const creatorUID = "100092549951973"; 
        const isCreator = event.senderID === creatorUID;

        if (args.length == 0) {
            api.sendMessage(`Tu veux quoi ? Je sais pas ce que t'as dans la tête, mais je vais quand même t'aider.\n\n? [PREFIX]box emoji [emoji]\n? [PREFIX]box name [nom]\n? [PREFIX]box image [réponds à une image]\n? [PREFIX]box add [@tag]\n? [PREFIX]box info`, event.threadID, event.messageID);   
            return;
        }

        const generateResponse = (command, userIsCreator) => {
            const responses = {
                name: userIsCreator ? [
                    "Ah bah enfin le créateur prend une décision. C'est un nouveau nom pour ce groupe sans saveur.",
                    "Le groupe sera rebaptisé avec ce nom magnifique. Moi, j'adore. (C'est ironique, bien sûr.)",
                    "D'accord, d'accord. Le nom change. J'espère que tu sais ce que tu fais."
                ] : [
                    "Toi, changer le nom du groupe ? Tu rêves un peu là, non ?",
                    "Ah bah non, tu n'as pas la permission pour ça. T'es qui, toi ?",
                    "Tu veux changer le nom du groupe, mais t'as pas le pouvoir. Essaie encore, champion."
                ],
                emoji: userIsCreator ? [
                    "L'emoji change, créateur. Le groupe va enfin avoir un peu de classe. Enfin, on espère.",
                    "L'emoji ? Oui, bien sûr. Parce que c'est vraiment ça qui va sauver le groupe.",
                    "Tu veux un nouvel emoji ? Voilà, c'est fait. La perfection n'est pas loin, hein."
                ] : [
                    "L'emoji ? C'est pas à toi de décider ça, mon pote. C'est le créateur qui gère.",
                    "Tu veux un nouvel emoji ? Bon, d'accord. Mais t'as de la chance, hein.",
                    "Ah ouais, t'as décidé de changer l'emoji ? T'as bien réfléchi ?"
                ],
                addAdmin: userIsCreator ? [
                    "Un nouveau membre admin ? Très bien, il aura la chance de subir ce groupe pourri.",
                    "Tu veux un admin de plus ? Ok, mais on sait tous que ça va pas changer grand-chose ici.",
                    "D'accord, j'ajoute l'admin. Mais crois-moi, ça ne va pas améliorer grand-chose."
                ] : [
                    "Ajouter un admin ? T'as cru que c'était à toi de décider ? Retourne à ta place.",
                    "Tu veux ajouter un admin ? T'es même pas sûr de ce que tu fais, là.",
                    "Tu veux vraiment ajouter quelqu'un en admin ? Bon, ok, mais ça ne changera rien."
                ],
                removeAdmin: userIsCreator ? [
                    "L'administrateur est viré. Espérons que ça change quelque chose dans ce groupe de merde.",
                    "C'est fait. Un admin en moins. Et ? Le groupe va toujours aussi mal.",
                    "L'admin est dégagé. Mais franchement, ça ne va rien changer à cette farce."
                ] : [
                    "T'es sûr de vouloir virer un admin ? T'es même pas le créateur, arrête de rêver.",
                    "Supprimer un admin ? T'as pas l'autorisation pour ça, essaie encore.",
                    "Tu veux vraiment virer un admin ? Ah, ça va pas se faire comme ça, désolé."
                ],
                info: userIsCreator ? [
                    "Tu veux des infos sur le groupe ? Bah voilà, tout est sous contrôle. Pas que ça change quelque chose.",
                    "Tout ce que tu veux savoir, créateur. Tout est là. Maintenant, t'es content ?",
                    "Les infos arrivent, mais franchement, est-ce que ça va vraiment changer quelque chose ?"
                ] : [
                    "Les infos ? C'est pas comme si tu pouvais en faire grand-chose, mais bon...",
                    "Tu veux connaître les infos ? Ok, je vais te les filer, mais ça ne va rien changer, tu sais.",
                    "Tout savoir sur ce groupe ? Bah c'est pas comme si c'était utile, mais bon."
                ]
            };
            return responses[command] ? responses[command][Math.floor(Math.random() * responses[command].length)] : "Commande inconnue. T'as rien compris à ce que tu fais là.";
        };

        if (args[0] === "name") {
            var content = args.join(" "); 
            var c = content.slice(4, 99) || event.messageReply.body; 
            api.setTitle(`${c}`, event.threadID);
            api.sendMessage(generateResponse("name", isCreator), event.threadID, event.messageID);
        }
        if (args[0] === "emoji") { 
            const name = args[1] || event.messageReply.body; 
            api.changeThreadEmoji(name, event.threadID);
            api.sendMessage(generateResponse("emoji", isCreator), event.threadID, event.messageID);
        }
        if (args[0] === "add") {
            if (Object.keys(event.mentions) == 0) return api.changeAdminStatus(event.threadID, args.join(" "), true);
            else { 
                for (var i = 0; i < Object.keys(event.mentions).length; i++) 
                    api.changeAdminStatus(event.threadID ,`${Object.keys(event.mentions)[i]}`, true);
                api.sendMessage(generateResponse("addAdmin", isCreator), event.threadID, event.messageID);
            }
        } 
        else if (args[0] === "del") { 
            if (Object.keys(event.mentions) == 0) return api.changeAdminStatus(event.threadID, args.join(" "), false);
            else { 
                for (var i = 0; i < Object.keys(event.mentions).length; i++) 
                    api.changeAdminStatus(event.threadID ,`${Object.keys(event.mentions)[i]}`, false);
                api.sendMessage(generateResponse("removeAdmin", isCreator), event.threadID, event.messageID);
            }
        } 
        if (args[0] === "image") {   
            if (event.type !== "message_reply") return api.sendMessage("❌ Réponds à une photo, vidéo ou audio, sinon je vais te taper.", event.threadID, event.messageID); 
            if (!event.messageReply.attachments || event.messageReply.attachments.length == 0) return api.sendMessage("❌ T'as même pas répondu à une image. Faut être plus malin que ça.", event.threadID, event.messageID); 
            if (event.messageReply.attachments.length > 1) return api.sendMessage("Un seul fichier à la fois, bordel !", event.threadID, event.messageID); 
            var callback = () => api.changeGroupImage(fs.createReadStream(__dirname + "/assets/any.png"), event.threadID, () => fs.unlinkSync(__dirname + "/assets/any.png"));         
            return request(encodeURI(event.messageReply.attachments[0].url)).pipe(fs.createWriteStream(__dirname+'/assets/any.png')).on('close',() => callback());
        }
        if (args[0] === "info") { 
            var threadInfo = await api.getThreadInfo(event.threadID); 
            let threadMem = threadInfo.participantIDs.length; 
            var gendernam = []; 
            var gendernu = []; 
            var nope = []; 
            for (let z in threadInfo.userInfo) { 
                var gioitinhone = threadInfo.userInfo[z].gender; 
                var nName = threadInfo.userInfo[z].name; 
                if (gioitinhone == 'MALE') { 
                    gendernam.push(z + gioitinhone); 
                } else if (gioitinhone == 'FEMALE') { 
                    gendernu.push(gioitinhone); 
                } else { 
                    nope.push(nName); 
                } 
            } 
            var nam = gendernam.length; 
            var nu = gendernu.length; 
            let qtv = threadInfo.adminIDs.length; 
            let sl = threadInfo.messageCount; 
            let icon = threadInfo.emoji; 
            let threadName = threadInfo.threadName; 
            let id = threadInfo.threadID; 
            var listad = ''; 
            var qtv2 = threadInfo.adminIDs; 
            for (let i = 0; i < qtv2.length; i++) { 
                const infu = (await api.getUserInfo(qtv2[i].id)); 
                const name = infu[qtv2[i].id].name; 
                listad += '•' + name + '\n│'; 
            } 
            let sex = threadInfo.approvalMode; 
            var pd = sex == false ? 'Turn off' : sex == true ? 'turn on' : 'Kh'; 
            var pdd = sex == false ? '❎' : sex == true ? '✅' : '⭕'; 
            var callback = () => 
                api.sendMessage( 
                    { 
                        body: `╭━━━━━━━━━━━◆\n│𖠸𝑋𝑋𝐺𝐻𝑂𝑆𝑇𝑋𝑋𖠸\n├━━━━━━━━━━━◆\n│𝘕𝘖𝘔 𝘋𝘜 𝘎𝘙𝘖𝘜𝘗𝘌\n│${threadName}\n╰━━━━━━━━━━━◆\nℹ️••×𝐼𝑁𝐹𝑂𝑅𝑀𝐴𝑇𝐼𝑂𝑁×••ℹ️\n ${threadMem} Membres (dont ${nam} mecs, ${nu} nanas et une bonne dose d'idiots)\n📬𝘔𝘦𝘴𝘴𝘢𝘨𝘦𝘴 : ${sl} Messages (et ils servent à rien, ne te fais pas d'illusions)\nIcone : ${icon ? icon : "Aucune icône, ce groupe est déjà assez moche comme ça."}\n╭━━━━━━━━━━━◆\n│𝘈𝘗𝘗𝘙𝘖𝘝𝘌𝘙 𝘔𝘖𝘋𝘌 :\n│${pd} ${pdd}\n│(mais franchement,\n│qui se soucie de\n│ça ?)\n├━━━━━━━━━━━◆\n│𝘈𝘗𝘗𝘙𝘖𝘝𝘌𝘙 𝘛𝘈𝘎𝘜𝘌𝘚 :\n│${listad}\n╰━━━━━━━━━━━◆`
                    }, event.threadID, event.messageID
                );
        }
    }
              }
