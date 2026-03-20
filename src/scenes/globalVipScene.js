import { Scenes } from 'telegraf';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { sendMainMenu } from '../utils/menuUtils.js';

const globalVipScene = new Scenes.WizardScene(
    'GLOBAL_VIP_SCENE',
    // 1-qadam: Muddatni so'rash
    async (ctx) => {
        await ctx.reply('🌐 <b>GLOBAL VIP BERYAPSIZ</b>\n\nBarcha foydalanuvchilarga xizmat ko\'rsatadigan VIP muddatini (KUN hisobida) faqat raqamda kiriting:\n\n<i>Masalan: 3</i>\n<i>Bekor qilish uchun <b>/cancel</b> yozing.</i>', { parse_mode: 'HTML' });
        return ctx.wizard.next();
    },
    // 2-qadam: Bazaga yozish
    async (ctx) => {
        if (ctx.message && ctx.message.text === '/cancel') {
            await ctx.reply('❌ Barchaga VIP berish bekor qilindi.');
            sendMainMenu(ctx);
            return ctx.scene.leave();
        }

        const days = parseInt(ctx.message?.text);
        if (isNaN(days) || days <= 0) {
            await ctx.reply('❌ Ilitmos faqat musbat raqam kiriting (masalan: 3). Qaytadan raqam yozing:');
            return; // Stay in this step
        }

        try {
             const now = new Date();
             const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

             // Hech VIP si yoq yoki VIPi ushbu muddatdan oldin tugaydiganlarga update qilamiz
             const result = await User.updateMany(
                 {
                     $or: [
                         { vipUntil: { $exists: false } },
                         { vipUntil: { $lt: targetDate } },
                         { vipUntil: null }
                     ]
                 },
                 { $set: { vipUntil: targetDate } }
             );

             await ctx.reply(`✅ <b>MUVAFFAQIYATLI BAJARILDI!</b>\n\n${result.modifiedCount} ta foydalanuvchiga ${days} kunlik global VIP hammaga taqdim etildi!`, { parse_mode: 'HTML' });
             logger.info(`Global VIP by ${ctx.from.id}: ${days} kun. Updatelar soni: ${result.modifiedCount}`);
        } catch (e) {
             logger.error('Global VIP Error:', e);
             await ctx.reply('❌ Tizimda qandaydir xatolik yuz berdi.');
        }

        sendMainMenu(ctx);
        return ctx.scene.leave();
    }
);

export default globalVipScene;
