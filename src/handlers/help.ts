import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

const HELP =
  "PriceWatch tracks crypto prices and alerts you when thresholds are hit.\n\n" +
  "Tap /start to open the menu, then:\n" +
  "• 📋 Watchlist — add or remove tickers\n" +
  "• ➕ Add Alert — set price or percent alerts\n" +
  "• 💰 Price — check current prices\n" +
  "• 🔕 Quiet Hours — pause alerts at night\n" +
  "• 🌅 Morning Summary — daily price digest";

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

composer.command("help", async (ctx) => {
  await ctx.reply(HELP);
});

composer.callbackQuery("menu:help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(HELP, { reply_markup: backToMenu });
});

export default composer;
