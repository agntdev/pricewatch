import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import {
  mainMenuKeyboard,
  registerMainMenuItem,
  inlineButton,
  inlineKeyboard,
} from "../toolkit/index.js";

registerMainMenuItem({ label: "📋 Watchlist", data: "watchlist:manage", order: 10 });
registerMainMenuItem({ label: "➕ Add Alert", data: "alert:add", order: 20 });
registerMainMenuItem({ label: "✏️ Edit Alerts", data: "alert:edit", order: 30 });
registerMainMenuItem({ label: "💰 Price", data: "price:menu", order: 40 });
registerMainMenuItem({ label: "🔕 Quiet Hours", data: "quiet_hours:set", order: 50 });
registerMainMenuItem({ label: "🌅 Morning Summary", data: "summary:schedule", order: 60 });

const WELCOME = "👋 Welcome! Tap a button below to get started.";

function ensureDefaults(ctx: Ctx) {
  const s = ctx.session;
  if (s.onboarded) return;
  s.onboarded = true;
  s.watchlist = [
    { ticker: "BTC", name: "Bitcoin" },
    { ticker: "ETH", name: "Ethereum" },
    { ticker: "TON", name: "Toncoin" },
  ];
  s.alerts = [
    {
      id: "sample_pct_eth",
      ticker: "ETH",
      alertType: "percent",
      thresholdValue: 5,
      direction: "above",
      enabled: true,
      name: "ETH 5% move",
    },
  ];
  s.cooldownDuration = 300_000;
  s.step = "idle";
  s.flowData = {};
}

const composer = new Composer<Ctx>();

composer.command("start", async (ctx) => {
  ensureDefaults(ctx);
  await ctx.reply(WELCOME, { reply_markup: mainMenuKeyboard() });
});

composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  ensureDefaults(ctx);
  ctx.session.step = "idle";
  ctx.session.flowData = {};
  await ctx.editMessageText(WELCOME, { reply_markup: mainMenuKeyboard() });
});

export default composer;
