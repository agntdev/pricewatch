import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

function alertListText(ctx: Ctx): { text: string; markup: ReturnType<typeof inlineKeyboard> } {
  const alerts = ctx.session.alerts;
  if (alerts.length === 0) {
    return {
      text: "No alerts set up yet — tap ➕ Add Alert from the menu to create one.",
      markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    };
  }
  const lines = ["Your alerts:"];
  const rows: ReturnType<typeof inlineButton>[][] = [];
  for (const a of alerts) {
    const status = a.enabled ? "ON" : "OFF";
    const unit = a.alertType === "threshold" ? "$" : "%";
    lines.push(`• ${a.name ?? a.ticker} — ${a.direction} ${unit}${a.thresholdValue} [${status}]`);
    rows.push([
      inlineButton(`${a.ticker} ${a.direction} ${unit}${a.thresholdValue}`, `al:edit:pick:${a.id}`),
    ]);
  }
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);
  return { text: lines.join("\n"), markup: inlineKeyboard(rows) };
}

composer.callbackQuery("alert:edit", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "idle";
  const { text, markup } = alertListText(ctx);
  await ctx.editMessageText(text, { reply_markup: markup });
});

composer.callbackQuery(/^al:edit:pick:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const alertId = ctx.match![1];
  const alert = ctx.session.alerts.find((a) => a.id === alertId);
  if (!alert) {
    await ctx.answerCallbackQuery({ text: "Alert not found.", show_alert: true });
    return;
  }
  const unit = alert.alertType === "threshold" ? "$" : "%";
  const status = alert.enabled ? "ON" : "OFF";
  await ctx.editMessageText(
    `${alert.name ?? alert.ticker} (${alert.ticker})\n` +
      `Type: ${alert.alertType === "threshold" ? "Price threshold" : "Percent change"}\n` +
      `Trigger: ${alert.direction} ${unit}${alert.thresholdValue}\n` +
      `Status: ${status}`,
    {
      reply_markup: inlineKeyboard([
        [
          inlineButton(
            alert.enabled ? "⏸ Disable" : "▶️ Enable",
            `al:edit:toggle:${alertId}`,
          ),
        ],
        [inlineButton("🗑 Remove", `al:edit:remove:${alertId}`)],
        [inlineButton("⬅️ Back to alerts", "alert:edit")],
      ]),
    },
  );
});

composer.callbackQuery(/^al:edit:toggle:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const alertId = ctx.match![1];
  const alert = ctx.session.alerts.find((a) => a.id === alertId);
  if (!alert) {
    await ctx.answerCallbackQuery({ text: "Alert not found.", show_alert: true });
    return;
  }
  alert.enabled = !alert.enabled;
  const unit = alert.alertType === "threshold" ? "$" : "%";
  const status = alert.enabled ? "ON" : "OFF";
  await ctx.editMessageText(
    `${alert.name ?? alert.ticker} (${alert.ticker})\n` +
      `Type: ${alert.alertType === "threshold" ? "Price threshold" : "Percent change"}\n` +
      `Trigger: ${alert.direction} ${unit}${alert.thresholdValue}\n` +
      `Status: ${status}`,
    {
      reply_markup: inlineKeyboard([
        [
          inlineButton(
            alert.enabled ? "⏸ Disable" : "▶️ Enable",
            `al:edit:toggle:${alertId}`,
          ),
        ],
        [inlineButton("🗑 Remove", `al:edit:remove:${alertId}`)],
        [inlineButton("⬅️ Back to alerts", "alert:edit")],
      ]),
    },
  );
});

composer.callbackQuery(/^al:edit:remove:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const alertId = ctx.match![1];
  const alert = ctx.session.alerts.find((a) => a.id === alertId);
  if (!alert) {
    await ctx.answerCallbackQuery({ text: "Alert not found.", show_alert: true });
    return;
  }
  await ctx.editMessageText(`Remove alert "${alert.name ?? alert.ticker}"?`, {
    reply_markup: inlineKeyboard([
      [
        inlineButton("✅ Yes", `al:edit:rmconfirm:${alertId}`),
        inlineButton("❌ No", "alert:edit"),
      ],
    ]),
  });
});

composer.callbackQuery(/^al:edit:rmconfirm:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const alertId = ctx.match![1];
  const removed = ctx.session.alerts.find((a) => a.id === alertId);
  ctx.session.alerts = ctx.session.alerts.filter((a) => a.id !== alertId);
  const { text, markup } = alertListText(ctx);
  await ctx.editMessageText(
    removed ? `Removed "${removed.name ?? removed.ticker}". ${text}` : text,
    { reply_markup: markup },
  );
});

export default composer;
