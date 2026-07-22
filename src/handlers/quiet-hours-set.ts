import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

function quietHoursText(ctx: Ctx): string {
  const start = ctx.session.quietHoursStart;
  const end = ctx.session.quietHoursEnd;
  if (!start || !end) return "Quiet hours are not set.";
  return `Quiet hours: ${start} – ${end} (alerts paused during this window).`;
}

composer.callbackQuery("quiet_hours:set", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "quiet_start";
  const current = quietHoursText(ctx);
  await ctx.editMessageText(
    `${current}\n\nEnter the start time for quiet hours (HH:MM, 24h format, e.g. 22:00):`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("Clear quiet hours", "qt:clear")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

composer.callbackQuery("qt:clear", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.quietHoursStart = undefined;
  ctx.session.quietHoursEnd = undefined;
  ctx.session.step = "idle";
  await ctx.editMessageText("Quiet hours cleared.", {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

composer.on("message:text", async (ctx, next) => {
  const step = ctx.session.step;

  if (step === "quiet_start") {
    const time = parseTime(ctx.message.text.trim());
    if (!time) {
      await ctx.reply("Enter a valid time in HH:MM format (e.g. 22:00).");
      return;
    }
    ctx.session.flowData = { quietStart: time };
    ctx.session.step = "quiet_end";
    await ctx.reply(
      `Start time: ${time}. Now enter the end time (HH:MM, e.g. 07:00):`,
      {
        reply_markup: inlineKeyboard([
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      },
    );
    return;
  }

  if (step === "quiet_end") {
    const time = parseTime(ctx.message.text.trim());
    if (!time) {
      await ctx.reply("Enter a valid time in HH:MM format (e.g. 07:00).");
      return;
    }
    const fd = ctx.session.flowData as Record<string, unknown>;
    ctx.session.quietHoursStart = fd.quietStart as string;
    ctx.session.quietHoursEnd = time;
    ctx.session.step = "idle";
    ctx.session.flowData = {};
    await ctx.reply(
      `Quiet hours set: ${ctx.session.quietHoursStart} – ${time}. Alerts will be paused during this window.`,
      {
        reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
      },
    );
    return;
  }

  await next();
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
