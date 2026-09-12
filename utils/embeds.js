const { EmbedBuilder } = require('discord.js');

const COLORS = {
  success: 0x57f287,
  error: 0xed4245,
  warning: 0xfee75c,
  info: 0x5865f2,
};

function baseEmbed(color) {
  return new EmbedBuilder().setColor(color).setTimestamp();
}

module.exports = {
  COLORS,
  success(title, description) {
    return baseEmbed(COLORS.success).setTitle(`✅ ${title}`).setDescription(description || null);
  },
  error(title, description) {
    return baseEmbed(COLORS.error).setTitle(`❌ ${title}`).setDescription(description || null);
  },
  warning(title, description) {
    return baseEmbed(COLORS.warning).setTitle(`⚠️ ${title}`).setDescription(description || null);
  },
  info(title, description) {
    return baseEmbed(COLORS.info).setTitle(title).setDescription(description || null);
  },
};
