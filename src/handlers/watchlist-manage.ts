import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

function watchlistMenu(ctx: Ctx) {
  const wl = ctx.session.watchlist;
  if (wl.length === 0) {
    return {
      text: "Your watchlist is empty — tap Add to get started.",
      markup: inlineKeyboard([
        [inlineButton("➕ Add ticker", "wl:add:start")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    };
  }
  const rows = wl.map((item) => [
    inlineButton(`${item.ticker}${item.name ? " — " + item.name : ""}`, `wl:view:${item.ticker}`),
  ]);
  rows.push([
    inlineButton("➕ Add ticker", "wl:add:start"),
    inlineButton("🗑 Remove", "wl:remove:pick"),
  ]);
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);
  return {
    text: `Your watchlist (${wl.length} tickers):`,
    markup: inlineKeyboard(rows),
  };
}

composer.callbackQuery("watchlist:manage", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "idle";
  const { text, markup } = watchlistMenu(ctx);
  await ctx.editMessageText(text, { reply_markup: markup });
});

composer.callbackQuery("wl:list", async (ctx) => {
  await ctx.answerCallbackQuery();
  const { text, markup } = watchlistMenu(ctx);
  await ctx.editMessageText(text, { reply_markup: markup });
});

composer.callbackQuery("wl:add:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "add_ticker";
  await ctx.editMessageText(
    "Which ticker do you want to add? (e.g. BTC, SOL, DOGE)",
    {
      reply_markup: inlineKeyboard([
        [inlineButton("⬅️ Back to watchlist", "wl:list")],
      ]),
    },
  );
});

composer.callbackQuery(/^wl:view:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match![1];
  const item = ctx.session.watchlist.find((w) => w.ticker === ticker);
  if (!item) {
    await ctx.answerCallbackQuery({ text: "Ticker not found.", show_alert: true });
    return;
  }
  const text = `${item.ticker}${item.name ? " — " + item.name : ""}`;
  await ctx.editMessageText(text, {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to watchlist", "wl:list")],
    ]),
  });
});

composer.callbackQuery(/^wl:remove:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match![1];
  if (ticker === "pick") {
    const wl = ctx.session.watchlist;
    if (wl.length === 0) {
      await ctx.answerCallbackQuery({ text: "Nothing to remove.", show_alert: true });
      return;
    }
    const rows = wl.map((item) => [
      inlineButton(`🗑 ${item.ticker}`, `wl:remove:${item.ticker}`),
    ]);
    rows.push([inlineButton("⬅️ Back to watchlist", "wl:list")]);
    await ctx.editMessageText("Tap a ticker to remove it:", {
      reply_markup: inlineKeyboard(rows),
    });
    return;
  }
  ctx.session.flowData = { removeTicker: ticker };
  ctx.session.step = "remove_watchlist_confirm";
  await ctx.editMessageText(`Remove ${ticker} from your watchlist?`, {
    reply_markup: inlineKeyboard([
      [
        inlineButton("✅ Yes", `wl:remove:confirm:${ticker}`),
        inlineButton("❌ No", "wl:list"),
      ],
    ]),
  });
});

composer.callbackQuery(/^wl:remove:confirm:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match![1];
  ctx.session.watchlist = ctx.session.watchlist.filter((w) => w.ticker !== ticker);
  ctx.session.step = "idle";
  ctx.session.flowData = {};
  const { text, markup } = watchlistMenu(ctx);
  await ctx.editMessageText(`${ticker} removed. ${text}`, { reply_markup: markup });
});

export default composer;
