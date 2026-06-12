require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Events
} = require("discord.js");

const db = require("./db");
const { syncMember } = require("./sync");
const { isAdmin } = require("./permissions");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.once(Events.ClientReady, () => {
  console.log(`Resonant Department Sync is online as ${client.user.tag}`);
});

// LIVE SYNC
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (newMember.guild.id !== process.env.SOURCE_GUILD) return;

  await syncMember(
    client,
    newMember,
    process.env.SOURCE_GUILD,
    process.env.TARGET_GUILD,
    db
  );
});

// SLASH COMMANDS
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!isAdmin(interaction.member)) {
    return interaction.reply({
      content: "You do not have permission to use this command.",
      ephemeral: true
    });
  }

  if (interaction.commandName === "status") {
    return interaction.reply({
      content: "Resonant Department Sync is online and operational.",
      ephemeral: true
    });
  }

  if (interaction.commandName === "syncuser") {
    const user = interaction.options.getUser("user");

    const sourceGuild = await client.guilds.fetch(process.env.SOURCE_GUILD);
    const sourceMember = await sourceGuild.members.fetch(user.id).catch(() => null);

    if (!sourceMember) {
      return interaction.reply({
        content: "That user is not in the Resonant RP Departments server.",
        ephemeral: true
      });
    }

    await syncMember(
      client,
      sourceMember,
      process.env.SOURCE_GUILD,
      process.env.TARGET_GUILD,
      db
    );

    return interaction.reply({
      content: `Synced ${user.tag}.`,
      ephemeral: true
    });
  }

  if (interaction.commandName === "resyncall") {
    await interaction.reply({
      content: "Starting full resync. This may take a moment.",
      ephemeral: true
    });

    const sourceGuild = await client.guilds.fetch(process.env.SOURCE_GUILD);
    const members = await sourceGuild.members.fetch();

    let count = 0;

    for (const [, member] of members) {
      await syncMember(
        client,
        member,
        process.env.SOURCE_GUILD,
        process.env.TARGET_GUILD,
        db
      );

      count++;
    }

    return interaction.followUp({
      content: `Full resync complete. Checked ${count} members.`,
      ephemeral: true
    });
  }

  if (interaction.commandName === "ignore") {
    const roleName = interaction.options.getString("role");

    db.run(
      "INSERT OR IGNORE INTO ignored_roles (role_name) VALUES (?)",
      [roleName]
    );

    return interaction.reply({
      content: `Ignored role: ${roleName}`,
      ephemeral: true
    });
  }

  if (interaction.commandName === "unignore") {
    const roleName = interaction.options.getString("role");

    db.run(
      "DELETE FROM ignored_roles WHERE role_name = ?",
      [roleName]
    );

    return interaction.reply({
      content: `Unignored role: ${roleName}`,
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);