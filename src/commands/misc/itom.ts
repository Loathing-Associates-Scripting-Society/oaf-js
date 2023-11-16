import { Events, Message } from "discord.js";

import { discordClient } from "../../clients/discord.js";

const ITOM_MATCHER = /(?:\W|^)(itoms?)(?:[^a-z]|$)/i;

async function onMessage(message: Message) {
  if (message.author.bot) return;
  if (!("send" in message.channel)) return;
  const member = message.member;
  if (!member) return;

  if (message.content.match(ITOM_MATCHER)) {
    try {
      await message.react("<:minusone:748016030357520464>");
    } catch (error) {
      const stringedError = `${error}`;
      if (stringedError.includes("Reaction blocked")) {
        await message.member?.kick("You mess with the bot, you get the boot");
      } else {
        discordClient.alert(
          `Tried to :minusone: a message containing the forbidden string by ${message.author}; received error ${error}.`,
        );
      }
    }
  }
}

export async function init() {
  discordClient.on(Events.MessageCreate, onMessage);
}
