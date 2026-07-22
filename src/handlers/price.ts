import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { fetchPrices, fetchPrice, supportedTickers, lookupTickerId } from "../prices.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("price:menu", async (ctx) => {
  await ctx.answerCallbackQuery();
  const wl = ctx.session.watchlist;
  if (wl.length === 0) {
    await ctx.editMessageText(
      "Your watchlist is empty — add some tickers first to check prices.",
      { reply_markup: inlineKeyboard([[inlineButton("📋 Manage watchlist", "watchlist:manage")]]) },
    );
    return;
  }
  const tickers = wl.map((w) => w.ticker);
  const prices = await fetchPrices(tickers);
  if (prices.length === 0) {
    await ctx.editMessageText(
      "Couldn't fetch prices right now — try again in a moment.",
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
    );
    return;
  }
  const lines = prices.map(
    (p) => `${p.ticker}: $${formatPrice(p.priceUsd)}`,
  );
  await ctx.editMessageText(lines.join("\n"), {
    reply_markup: inlineKeyboard([
      [inlineButton("🔄 Refresh", "price:menu")],
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

composer.command("price", async (ctx) => {
  const arg = ctx.match?.trim().toUpperCase();
  if (!arg || arg === "ALL") {
    const wl = ctx.session.watchlist;
    if (wl.length === 0) {
      await ctx.reply(
        "Your watchlist is empty — add some tickers first to check prices.",
        { reply_markup: inlineKeyboard([[inlineButton("📋 Manage watchlist", "watchlist:manage")]]) },
      );
      return;
    }
    const tickers = wl.map((w) => w.ticker);
    const prices = await fetchPrices(tickers);
    if (prices.length === 0) {
      await ctx.reply("Couldn't fetch prices right now — try again in a moment.", {
        reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
      });
      return;
    }
    const lines = prices.map((p) => `${p.ticker}: $${formatPrice(p.priceUsd)}`);
    await ctx.reply(lines.join("\n"), {
      reply_markup: inlineKeyboard([
        [inlineButton("🔄 Refresh", "price:menu")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
    return;
  }
  const id = lookupTickerId(arg);
  if (!id) {
    const supported = supportedTickers().slice(0, 10).join(", ");
    await ctx.reply(
      `Couldn't find a price for "${arg}". Check the ticker symbol and try again.\n\nSome supported tickers: ${supported}`,
    );
    return;
  }
  const price = await fetchPrice(arg);
  if (!price) {
    await ctx.reply("Couldn't fetch prices right now — try again in a moment.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }
  await ctx.reply(`${price.ticker}: $${formatPrice(price.priceUsd)}`, {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

function formatPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(2);
  if (n >= 0.01) return n.toFixed(4);
  return n.toFixed(6);
}

export default composer;
