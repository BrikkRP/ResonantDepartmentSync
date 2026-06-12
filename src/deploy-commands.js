require("dotenv").config();

const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Check if Resonant Department Sync is online"),

  new SlashCommandBuilder()
    .setName("syncuser")
    .setDescription("Sync one user from Departments to Roleplay")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user to sync")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("resyncall")
    .setDescription("Resync all users from Departments to Roleplay"),

  new SlashCommandBuilder()
    .setName("ignore")
    .setDescription("Ignore a role from syncing")
    .addStringOption(option =>
      option
        .setName("role")
        .setDescription("Exact role name to ignore")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("unignore")
    .setDescription("Allow a previously ignored role to sync again")
    .addStringOption(option =>
      option
        .setName("role")
        .setDescription("Exact role name to unignore")
        .setRequired(true)
    )
].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

async function deployCommands() {
  try {
    console.log("Deploying slash commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("Slash commands deployed.");
  } catch (error) {
    console.error(error);
  }
}

deployCommands();