async function getIgnoredRoles(db) {
  return new Promise(resolve => {
    db.all("SELECT role_name FROM ignored_roles", (err, rows) => {
      if (err) {
        console.error(err);
        return resolve([]);
      }

      resolve(rows.map(row => row.role_name));
    });
  });
}

async function getSyncableRoleNames(sourceGuild, targetGuild, db) {
  const ignoredRoles = await getIgnoredRoles(db);

  const sourceRoleNames = new Set(
    sourceGuild.roles.cache
      .filter(role => role.name !== "@everyone")
      .filter(role => !ignoredRoles.includes(role.name))
      .map(role => role.name)
  );

  return targetGuild.roles.cache
    .filter(role => role.name !== "@everyone")
    .filter(role => !ignoredRoles.includes(role.name))
    .filter(role => sourceRoleNames.has(role.name))
    .map(role => role.name);
}

async function syncMember(client, member, sourceGuildId, targetGuildId, db) {
  const sourceGuild = await client.guilds.fetch(sourceGuildId);
  const targetGuild = await client.guilds.fetch(targetGuildId);

  await sourceGuild.roles.fetch();
  await targetGuild.roles.fetch();

  const targetMember = await targetGuild.members.fetch(member.id).catch(() => null);

  if (!targetMember) {
    return;
  }

  const syncableRoleNames = await getSyncableRoleNames(sourceGuild, targetGuild, db);

  const sourceRoles = member.roles.cache;
  const targetRoles = targetMember.roles.cache;

  // ADD only roles that:
  // 1. exist in BOTH servers
  // 2. are NOT ignored
  // 3. the user has in Departments
  for (const roleName of syncableRoleNames) {
    const sourceHasRole = sourceRoles.some(role => role.name === roleName);
    const targetRole = targetGuild.roles.cache.find(role => role.name === roleName);

    if (!sourceHasRole || !targetRole) continue;

    if (!targetRoles.has(targetRole.id)) {
      await targetMember.roles.add(targetRole.id).catch(error => {
        console.error(`Failed to add role ${targetRole.name}:`, error.message);
      });
    }
  }

  // REMOVE only roles that:
  // 1. exist in BOTH servers
  // 2. are NOT ignored
  // 3. the user no longer has in Departments
  for (const roleName of syncableRoleNames) {
    const sourceHasRole = sourceRoles.some(role => role.name === roleName);
    const targetRole = targetGuild.roles.cache.find(role => role.name === roleName);

    if (sourceHasRole || !targetRole) continue;

    if (targetRoles.has(targetRole.id)) {
      await targetMember.roles.remove(targetRole.id).catch(error => {
        console.error(`Failed to remove role ${targetRole.name}:`, error.message);
      });
    }
  }
}

module.exports = { syncMember };