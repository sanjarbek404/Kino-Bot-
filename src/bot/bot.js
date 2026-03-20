import { Telegraf, Scenes, session } from 'telegraf';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import { authMiddleware } from './middleware.js';
import addMovieScene from '../scenes/addMovieScene.js';
import broadcastScene from '../scenes/broadcastScene.js';
import vipScene from '../scenes/vipScene.js';
import reviewScene from '../scenes/reviewScene.js';
import requestScene from '../scenes/requestScene.js';
import reportScene from '../scenes/reportScene.js';
import promoWizard from '../scenes/promoScene.js';
import redeemSchema from '../scenes/promoRedeemScene.js';
import editMovieScene from '../scenes/editMovieScene.js';
import autoPostSettingsScene from '../scenes/autoPostSettingsScene.js';
import mandatorySubscriptionScene from '../scenes/mandatorySubscriptionScene.js';
import userProfileScene from '../scenes/userProfileScene.js';
import globalVipScene from '../scenes/globalVipScene.js';
import { setupAdminCommands } from '../commands/admin.js';
import { setupStartCommand } from '../commands/start.js';
import { setupUserCommands } from '../commands/user.js';
import { setupCategoryCommands, setupInlineSearch } from '../commands/category.js';
import { setupChannelGuard } from '../handlers/channelGuard.js';
import { initVipScheduler } from '../services/vipScheduler.js';

// Setup Scenes
const stage = new Scenes.Stage([
    addMovieScene, 
    broadcastScene, 
    vipScene, 
    reviewScene, 
    requestScene, 
    reportScene, 
    promoWizard, 
    redeemSchema, 
    editMovieScene, 
    autoPostSettingsScene, 
    mandatorySubscriptionScene,
    userProfileScene,
    globalVipScene
]);

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());
// Custom middleware
bot.use(authMiddleware);

bot.use(stage.middleware());

// Setup Commands
setupAdminCommands(bot);
setupStartCommand(bot);
setupCategoryCommands(bot);
setupUserCommands(bot); // User commands should be last (has text handler)
setupInlineSearch(bot);
setupChannelGuard(bot);

// Initialize VIP Expiration Scheduler
initVipScheduler(bot);

// Check Subscription Callback
bot.action('check_subscription', async (ctx) => {
    try {
        await ctx.answerCbQuery('✅ Tekshirilmoqda...');
        await ctx.deleteMessage().catch(() => { });
        // Just send a simple message to trigger middleware re-check
        await ctx.reply('🔄 Obuna tekshirilmoqda...');
    } catch (e) {
        logger.error('Check sub error:', e);
    }
});

// Error handling
bot.catch((err, ctx) => {
    logger.error(`Ooops, encountered an error for ${ctx.updateType}`, err);
    ctx.reply("❌ Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.");
});

export default bot;
