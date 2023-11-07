const express = require("express");
const discord = require("discord.js");
const fs = require('fs');
const app = express();
const client = new discord.Client({
  partials: Object.values(discord.Partials),
  intents: Object.values(discord.IntentsBitField.Flags),
});
const prefix = process.env.prefix;
const activity = process.env.activity;
const token = process.env.DISCORD_BOT_TOKEN;
try {
  app.get("/", (req, res) => {
    res.send("Botがオンラインです！");
  });

  app.listen(3000, () => { });

  client.on("ready", (message) => {
    console.log("Botが起動したよ～");
    client.user.setActivity(activity, { type: discord.ActivityType.Playing });
  });

  // JSTに変換
  var old_date = new Date(Date.now() + ((new Date().getTimezoneOffset() + (9 * 60)) * 60 * 1000));
  // 60秒おきに実行
  setInterval(() => {
    // JSTに変換
    const date = new Date(Date.now() + ((new Date().getTimezoneOffset() + (9 * 60)) * 60 * 1000));

    if (old_date.getHours() === 4 && date.getHours() === 5) {
      const today_str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
      const yesterday = new Date(date);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterday_str = yesterday.getFullYear() + "-" + (yesterday.getMonth() + 1) + "-" + yesterday.getDate();
      
      const file = fs.readFileSync('./study_log.json', 'utf-8');
      var data = JSON.parse(file);
      for (let user_id of data.user_id) {
        user_log = data.log.filter((log) => log.user_id === user_id)[0];
        if ((user_log.date.indexOf(today_str) === -1) && (user_log.date.indexOf(yesterday_str) === -1)) {
          const new_penalty = data.penalty.map(function(item) {
            if (item.user_id === user_id) {
              item.point += 1;
            }
            return item;
          });
          data.penalty = new_penalty;
        }
      }
      fs.writeFileSync('./study_log.json', JSON.stringify(data, null, "\t"));
    }

    old_date = date;
  }, 60000);

  client.on("messageCreate", async (message) => {
    if (message.author.id == client.user.id || message.author.bot) return;
    if (message.mentions.has(client.user)) {
      await message.reply("呼んだ?");
    }
    if (!message.content.startsWith(prefix)) return; //ボットのプレフィックスからメッセージが始まっているか確認
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    if (command === "help") {
      //コマンド名
      await message.channel.send({
        embeds: [
          {
            title: "ヘルプ",
            description:
              "全てのコマンドの初めに`" + prefix + "`をつける必要があります。",
            fields: [
              {
                name: "ヘルプ",
                value: "`help`",
              },
            ],
          },
        ],
      });
    }
    if (command === "adduser") {
      const user_id = message.author.id;
      const user_name = message.author.username;
      const file = fs.readFileSync("./study_log.json", "utf-8");
      var data = JSON.parse(file);
      if (!data.user_id.includes(user_id)) {
        data.user_id.push(user_id);
        data.log.push({
          user_id: user_id,
          date: [],
        });
        data.penalty.push({
          user_id: user_id,
          point: 0,
        });
        fs.writeFileSync("./study_log.json", JSON.stringify(data, null, "\t"));
        await message.channel.send("user " + user_name + " is added!\nID: " + user_id);
      } else {
        await message.channel.send("user " + user_name + " is already added!");
      }
    }
    if (command === "deleteuser") {
      const user_id = message.author.id;
      const user_name = message.author.username;
      const file = fs.readFileSync("./study_log.json", "utf-8");
      var data = JSON.parse(file);
      if (data.user_id.includes(user_id)) {
        const new_user_id = data.user_id.filter(function(item) {
          if (item != user_id) return true;
        });
        data.user_id = new_user_id;
        const new_log = data.log.filter(function(item) {
          if (item.user_id != user_id) return true;
        });
        data.log = new_log;
        const new_penalty = data.penalty.filter(function(item) {
          if (item.user_id != user_id) return true;
        });
        data.penalty = new_penalty;
        fs.writeFileSync("./study_log.json", JSON.stringify(data, null, "\t"));
        await message.channel.send("user " + user_name + " is deleted!");
      } else {
        await message.channel.send("user " + user_name + " is not exist!");
      }
    }
    if (command === "study") {
      const user_id = message.author.id;
      const user_name = message.author.username;
      const file = fs.readFileSync('./study_log.json', 'utf-8');
      var data = JSON.parse(file);
      const date = new Date(Date.now() + ((new Date().getTimezoneOffset() + (9 * 60)) * 60 * 1000));
      const today_str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
      if (data.user_id.includes(user_id)) {
        const new_log = data.log.map(function(item) {
          if (item.user_id === user_id) {
            if (!item.date.includes(today_str)) {
              item.date.push(today_str);
            }
          }
          return item;
        });
        data.log = new_log;
        fs.writeFileSync("./study_log.json", JSON.stringify(data, null, "\t"));
        await message.react('👍');
      } else {
        await message.channel.send("user " + user_name + " is not exist!");
      }
    }
    if (command === "penalty") {
      const user_id = message.author.id;
      const user_name = message.author.username;
      const file = fs.readFileSync('./study_log.json', 'utf-8');
      var data = JSON.parse(file);
      if (data.user_id.includes(user_id)) {
        user_penalty = data.penalty.filter((log) => log.user_id === user_id)[0];
        await message.channel.send("user " + user_name + "`s panalty: " + user_penalty.point);
      }
    }
  });
  if (token == undefined) {
    console.log("DISCORD_BOT_TOKENが設定されていません。");
    process.exit(0);
  }

  client.login(token);
} catch (e) {
  console.log(`エラーが発生しました。\nエラー\n${e}`);
}
