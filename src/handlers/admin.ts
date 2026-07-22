import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const ADMIN_IDS = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((s) => parseInt(s.trim(), 10))
  .filter((n) => !isNaN(n));

const composer = new Composer<Ctx>();

composer.command("admin", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId || (ADMIN_IDS.length > 0 && !ADMIN_IDS.includes(userId))) {
    await ctx.reply("This command is owner-only.");
    return;
  }
  const session = ctx.session;
  const watchlistCount = session.watchlist.length;
  const alertCount = session.alerts.length;
  const activeAlerts = session.alerts.filter((a) => a.enabled).length;

  const tickerCounts: Record<string, number> = {};
  for (const a of session.alerts) {
    tickerCounts[a.ticker] = (tickerCounts[a.ticker] ?? 0) + 1;
  }
  const topTickers = Object.entries(tickerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const lines = [
    "📊 Admin Dashboard",
    "",
    `Watchlist tickers: ${watchlistCount}`,
    `Total alerts: ${alertCount} (${activeAlerts} active)`,
    "",
  ];

  if (topTickers.length > 0) {
    lines.push("Top tickers by alert count:");
    for (const [ticker, count] of topTickers) {
      lines.push(`  ${ticker}: ${count}`);
    }
  } else {
    lines.push("No alert data yet.");
  }

  await ctx.reply(lines.join("\n"), {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
