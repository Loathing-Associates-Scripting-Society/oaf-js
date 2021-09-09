import { Message } from "discord.js";
import { DiscordClient } from "./discord";
import { clamp } from "./utils";

export function attachKoLCommands(client: DiscordClient) {
  client.attachCommand("item", item, "Print the +item drop required to cap a drop.");
  client.attachCommand("level", level, "Finds the stats and substats needed for a given level.");
  client.attachCommand("stat", stat, "Finds the substats and level for a given mainstat total.");
  client.attachCommand(
    "substat",
    substat,
    "Finds the mainstat and level for a given substat total"
  );
  client.attachCommand(
    "fairy",
    fairy,
    "Print the +item drop supplied by a fairy of a given weight."
  );
  client.attachCommand(
    "leprechaun",
    lep,
    "Print the +meat drop supplied by a leprechaun of a given weight."
  );
  client.attachCommand("lep", lep, "Alias for leprechaun.");
  client.attachCommand(
    "volleyball",
    volley,
    "Print the +stat drop supplied by a volleyball of a given weight."
  );
  client.attachCommand("volley", volley, "Alias for volleyball.");
}

function item(message: Message, args: string[]): void {
  if (args.length === 0) {
    message.channel.send("Please supply a drop rate.");
    return;
  }
  const drop = parseFloat(args[1]) || 0;
  if (drop < 0.1) {
    message.channel.send("Please supply a sensible drop rate.");
    return;
  }
  if (drop > 99.9) {
    message.channel.send(`A 100% drop does not require any item drop bonus to cap.`);
    return;
  }
  message.channel.send(
    `A ${Number(drop.toFixed(1))}% drop requires a +${
      Math.ceil(10000 / Number(drop.toFixed(1))) - 100
    }% item drop bonus to cap.`
  );
}

function fairy(message: Message, args: string[]): void {
  if (args.length === 0) {
    message.channel.send("Please supply a fairy weight.");
    return;
  }
  const weight = parseInt(args[1]) || 0;
  if (weight <= 0) {
    message.channel.send("Please supply a positive fairy weight.");
    return;
  }
  message.channel.send(
    `A ${weight}lb fairy provides +${Number(
      (Math.sqrt(55 * weight) + weight - 3).toFixed(2)
    )}% item drop. (+${Number(
      (Math.sqrt(55 * weight * 1.25) + weight * 1.25 - 3).toFixed(2)
    )}% for Jumpsuited Hound Dog)`
  );
}

function lep(message: Message, args: string[]): void {
  if (args.length === 0) {
    message.channel.send("Please supply a leprechaun weight.");
    return;
  }
  const weight = parseInt(args[1]) || 0;
  if (weight <= 0) {
    message.channel.send("Please supply a positive leprechaun weight.");
    return;
  }
  message.channel.send(
    `A ${weight}lb leprechaun provides +${Number(
      (2 * (Math.sqrt(55 * weight) + weight - 3)).toFixed(2)
    )}% meat drop. (+${Number(
      (2 * (Math.sqrt(55 * weight * 1.25) + weight * 1.25 - 3)).toFixed(2)
    )}% for Hobo Monkey)`
  );
}

function volley(message: Message, args: string[]): void {
  if (args.length === 0) {
    message.channel.send("Please supply a volleyball weight.");
    return;
  }
  const weight = parseInt(args[1]) || 0;
  if (weight <= 0) {
    message.channel.send("Please supply a positive volleyball weight.");
    return;
  }
  message.channel.send(
    `A ${weight}lb volleyball provides +${2 + 0.2 * weight} substats per combat.`
  );
}

class StatBlock {
  level: number;
  mainstat: number;
  substat: number;

  constructor(level: number, mainstat: number, substat: number) {
    this.level = level;
    this.mainstat = mainstat;
    this.substat = substat;
  }
  static fromLevel(level: number): StatBlock {
    return new StatBlock(
      level,
      Math.pow(level, 2) - level * 2 + 5,
      Math.pow(Math.pow(level - 1, 2) + 4, 2)
    );
  }
  static fromMainstat(mainstat: number): StatBlock {
    return new StatBlock(
      1 + Math.floor(Math.sqrt(Math.max(0, mainstat - 4))),
      mainstat,
      Math.pow(mainstat, 2)
    );
  }
  static fromSubstat(substat: number): StatBlock {
    const mainstat = Math.floor(Math.sqrt(Math.max(0, substat)));
    return new StatBlock(1 + Math.floor(Math.sqrt(Math.max(0, mainstat - 4))), mainstat, substat);
  }
}

function level(message: Message, args: string[]): void {
  if (args.length === 0) {
    message.channel.send("Please supply a level.");
    return;
  }
  const level = parseInt(args[1]) || 0;
  if (level <= 0) {
    message.channel.send("Please supply a positive level.");
    return;
  }
  if (level === 1) {
    message.channel.send("Level 1 requires 0 mainstat or 0 total substats.");
    return;
  }
  if (level >= 255) {
    message.channel.send(
      "Maximum level 255 requires 64,520 mainstat or 4,162,830,400 total substats."
    );
    return;
  }
  const statBlock = StatBlock.fromLevel(level);
  message.channel.send(
    `Level ${
      statBlock.level
    } requires ${statBlock.mainstat.toLocaleString()} mainstat or ${statBlock.substat.toLocaleString()} total substats.`
  );
}

function stat(message: Message, args: string[]): void {
  if (args.length === 0) {
    message.channel.send("Please supply a mainstat.");
    return;
  }
  const mainstat = parseInt(args[1]) || 0;
  if (mainstat <= 0) {
    message.channel.send("Please supply a positive mainstat.");
    return;
  }
  const statBlock = StatBlock.fromMainstat(mainstat);
  if (statBlock.level >= 255) {
    message.channel.send(
      `Mainstat ${mainstat.toLocaleString()} (reached at ${statBlock.substat.toLocaleString()} total substat${
        statBlock.substat > 1 ? "s" : ""
      }) reaches maximum level 255.`
    );
    return;
  }
  const nextLevel = StatBlock.fromLevel(statBlock.level + 1);
  message.channel.send(
    `Mainstat ${mainstat.toLocaleString()} (reached at ${statBlock.substat.toLocaleString()} total substats) reaches level ${
      statBlock.level
    }.` +
      ` An additional ${(
        nextLevel.mainstat - statBlock.mainstat
      ).toLocaleString()} mainstat (requiring ${(
        nextLevel.substat - statBlock.substat
      ).toLocaleString()} more substat${
        nextLevel.substat - statBlock.substat > 1 ? "s" : ""
      }) is required to reach level ${nextLevel.level}.`
  );
}

function substat(message: Message, args: string[]): void {
  if (args.length === 0) {
    message.channel.send("Please supply a substat total.");
    return;
  }
  const substat = parseInt(args[1]) || 0;
  if (substat <= 0) {
    message.channel.send("Please supply a positive substat total.");
    return;
  }
  const statBlock = StatBlock.fromSubstat(substat);
  if (statBlock.level >= 255) {
    message.channel.send(
      `Substat total ${substat.toLocaleString()} reaches mainstat ${statBlock.mainstat.toLocaleString()} and maximum level 255.`
    );
    return;
  }
  const nextLevel = StatBlock.fromLevel(statBlock.level + 1);
  message.channel.send(
    `Substat total ${substat.toLocaleString()} reaches mainstat ${statBlock.mainstat.toLocaleString()} and level ${
      statBlock.level
    }.` +
      ` An additional ${(nextLevel.substat - statBlock.substat).toLocaleString()} total substat${
        nextLevel.substat - statBlock.substat > 1 ? "s are" : " is"
      } required to reach level ${nextLevel.level}.`
  );
}