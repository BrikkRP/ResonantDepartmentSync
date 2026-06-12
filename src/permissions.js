function isAdmin(member) {
  return (
    member.permissions.has("Administrator") ||
    member.roles.cache.some(role => role.name === "Admin")
  );
}

module.exports = { isAdmin };