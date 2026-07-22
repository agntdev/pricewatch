import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

function backToAlerts() {
  return inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);
}

composer.callbackQuery("alert:add", async (ctx) => {
  await ctx.answerCallbackQuery();
  const wl = ctx.session.watchlist;
  if (wl.length === 0) {
    await ctx.editMessageText(
      "Add a ticker to your watchlist first — you can't set alerts without one.",
      { reply_markup: inlineKeyboard([[inlineButton("📋 Manage watchlist", "watchlist:manage")]]) },
    );
    return;
  }
  const rows = wl.map((item) => [
    inlineButton(item.ticker, `al:add:ticker:${item.ticker}`),
  ]);
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);
  ctx.session.step = "alert_ticker";
  await ctx.editMessageText("Which ticker do you want to set an alert for?", {
    reply_markup: inlineKeyboard(rows),
  });
});

composer.callbackQuery(/^al:add:ticker:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match![1];
  ctx.session.flowData = { ticker };
  ctx.session.step = "alert_type";
  await ctx.editMessageText(
    `What kind of alert for ${ticker}?`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("📐 Price threshold", `al:add:type:threshold`)],
        [inlineButton("📊 Percent change", `al:add:type:percent`)],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

composer.callbackQuery(/^al:add:type:(threshold|percent)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const alertType = ctx.match![1] as "threshold" | "percent";
  (ctx.session.flowData as Record<string, unknown>).alertType = alertType;
  ctx.session.step = "alert_value";
  const unit = alertType === "threshold" ? "$" : "%";
  await ctx.editMessageText(
    `Enter the ${alertType === "threshold" ? "price" : "percent"} threshold (e.g. ${alertType === "threshold" ? "50000" : "5"}):`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

composer.callbackQuery(/^al:add:dir:(above|below)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const direction = ctx.match![1] as "above" | "below";
  (ctx.session.flowData as Record<string, unknown>).direction = direction;
  ctx.session.step = "alert_name";
  await ctx.editMessageText(
    "Give this alert a short name (or tap Skip):",
    {
      reply_markup: inlineKeyboard([
        [inlineButton("Skip", "al:add:name:skip")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

composer.callbackQuery("al:add:name:skip", async (ctx) => {
  await ctx.answerCallbackQuery();
  (ctx.session.flowData as Record<string, unknown>).name = undefined;
  await showConfirm(ctx);
});

composer.callbackQuery("al:add:confirm:yes", async (ctx) => {
  await ctx.answerCallbackQuery();
  const fd = ctx.session.flowData as Record<string, unknown>;
  const alert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ticker: fd.ticker as string,
    alertType: fd.alertType as "threshold" | "percent",
    thresholdValue: fd.thresholdValue as number,
    direction: fd.direction as "above" | "below",
    enabled: true,
    name: fd.name as string | undefined,
  };
  ctx.session.alerts.push(alert);
  ctx.session.step = "idle";
  ctx.session.flowData = {};
  await ctx.editMessageText(
    `Alert saved: ${alert.ticker} ${alert.direction} ${alert.alertType === "threshold" ? "$" : ""}${alert.thresholdValue}${alert.alertType === "percent" ? "%" : ""}`,
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
  );
});

composer.callbackQuery("al:add:confirm:no", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "idle";
  ctx.session.flowData = {};
  await ctx.editMessageText("Alert not saved.", {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

async function showConfirm(ctx: Ctx) {
  const fd = ctx.session.flowData as Record<string, unknown>;
  const ticker = fd.ticker as string;
  const alertType = fd.alertType as string;
  const value = fd.thresholdValue as number;
  const direction = fd.direction as string;
  const name = fd.name as string | undefined;
  const unit = alertType === "threshold" ? "$" : "%";
  const lines = [
    `Confirm your alert:`,
    `Ticker: ${ticker}`,
    `Type: ${alertType === "threshold" ? "Price threshold" : "Percent change"}`,
    `Trigger: ${direction} ${unit}${value}`,
  ];
  if (name) lines.push(`Name: ${name}`);
  ctx.session.step = "alert_confirm";
  await ctx.editMessageText(lines.join("\n"), {
    reply_markup: inlineKeyboard([
      [
        inlineButton("✅ Save", "al:add:confirm:yes"),
        inlineButton("❌ Cancel", "al:add:confirm:no"),
      ],
    ]),
  });
}

export { showConfirm };

composer.on("message:text", async (ctx, next) => {
  const step = ctx.session.step;
  const fd = ctx.session.flowData as Record<string, unknown>;

  if (step === "alert_ticker") {
    const ticker = ctx.message.text.trim().toUpperCase();
    if (!ticker || ticker.length > 10) {
      await ctx.reply("Enter a valid ticker symbol (e.g. BTC).");
      return;
    }
    fd.ticker = ticker;
    ctx.session.step = "alert_type";
    await ctx.reply(`What kind of alert for ${ticker}?`, {
      reply_markup: inlineKeyboard([
        [inlineButton("📐 Price threshold", "al:add:type:threshold")],
        [inlineButton("📊 Percent change", "al:add:type:percent")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
    return;
  }

  if (step === "alert_value") {
    const num = parseFloat(ctx.message.text.trim());
    if (isNaN(num) || num <= 0) {
      await ctx.reply("Enter a positive number.");
      return;
    }
    fd.thresholdValue = num;
    ctx.session.step = "alert_direction";
    await ctx.reply("Should the alert fire when the price goes above or below this value?", {
      reply_markup: inlineKeyboard([
        [inlineButton("📈 Above", "al:add:dir:above")],
        [inlineButton("📉 Below", "al:add:dir:below")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
    return;
  }

  if (step === "alert_name") {
    const text = ctx.message.text.trim();
    if (text.length > 50) {
      await ctx.reply("Name too long — keep it under 50 characters.");
      return;
    }
    fd.name = text || undefined;
    await showConfirm(ctx);
    return;
  }

  await next();
});

export default composer;
