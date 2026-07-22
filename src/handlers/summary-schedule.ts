import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

function summaryStatusText(ctx: Ctx): string {
  const t = ctx.session.morningSummaryTime;
  if (!t) return "Morning summary is not scheduled.";
  return `Morning summary scheduled at ${t} daily.`;
}

composer.callbackQuery("summary:schedule", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "summary_time";
  const current = summaryStatusText(ctx);
  await ctx.editMessageText(
    `${current}\n\nEnter the time for your daily summary (HH:MM, 24h format, e.g. 08:00):`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("Clear schedule", "sm:clear")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

composer.callbackQuery("sm:clear", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.morningSummaryTime = undefined;
  ctx.session.step = "idle";
  await ctx.editMessageText("Morning summary cleared.", {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "summary_time") return next();

  const time = parseTime(ctx.message.text.trim());
  if (!time) {
    await ctx.reply("Enter a valid time in HH:MM format (e.g. 08:00).");
    return;
  }
  ctx.session.morningSummaryTime = time;
  ctx.session.step = "idle";
  ctx.session.flowData = {};
  await ctx.reply(
    `Morning summary set for ${time} daily. You'll get a price overview each morning.`,
    {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    },
  );
});

function parseTime(input: string): string | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(input.trim());
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export default composer;
