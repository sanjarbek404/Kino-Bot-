import { Markup } from 'telegraf';
import logger from '../utils/logger.js';
import Category from '../models/Category.js';
import Movie from '../models/Movie.js';

export const setupCategoryCommands = (bot) => {

    // Handle "📂 Kategoriyalar"
    bot.hears(['📂 Kategoriyalar', '📂 Категории', '📂 Categories'], async (ctx) => {
        try {
            // Get genres from movies
            const genres = await Movie.distinct('genre');

            if (!genres || genres.length === 0) {
                return ctx.reply('📭 Hozircha kategoriyalar yo\'q.');
            }

            // Filter out empty genres
            const validGenres = genres.filter(g => g && g.trim());

            const buttons = validGenres.map(g => [Markup.button.callback(`🎭 ${g}`, `genre_${g}`)]);

            ctx.reply('📂 <b>Kategoriyalarni tanlang:</b>', {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard(buttons)
            });
        } catch (e) {
            logger.error('Category command error:', e);
            ctx.reply('❌ Xatolik yuz berdi.');
        }
    });

    // Handle genre selection
    bot.action(/genre_(.+)/, async (ctx) => {
        try {
            const genre = ctx.match[1];
            const movies = await Movie.find({ genre: { $regex: genre, $options: 'i' } });

            if (!movies || movies.length === 0) {
                return ctx.answerCbQuery('📭 Bu janrda kino topilmadi');
            }

            let msg = `🎭 <b>${genre}</b> janridagi kinolar:\n\n`;
            movies.slice(0, 15).forEach((m, i) => {
                msg += `${i + 1}. 🎬 ${m.title} — <code>${m.code}</code>\n`;
            });
            msg += '\n<i>Kino kodini yuboring va tomosha qiling!</i>';

            await ctx.editMessageText(msg, { parse_mode: 'HTML' });
            ctx.answerCbQuery().catch(() => { });
        } catch (e) {
            logger.error('Genre action error:', e);
            ctx.answerCbQuery('❌ Xatolik').catch(() => { });
        }
    });
};

// Inline Search Handler
export const setupInlineSearch = (bot) => {
    bot.on('inline_query', async (ctx) => {
        try {
            const query = ctx.inlineQuery?.query;

            if (!query || query.length < 2) {
                return ctx.answerInlineQuery([]);
            }

            const movies = await Movie.find({
                $text: { $search: query }
            }, { score: { $meta: "textScore" } })
            .sort({ score: { $meta: "textScore" } })
            .limit(20);

            const results = movies.map((movie) => ({
                type: 'article',
                id: String(movie._id),
                title: movie.title,
                description: `📅 ${movie.year || 'N/A'} | 🎭 ${movie.genre || 'N/A'} | 👁 ${movie.views || 0}`,
                thumb_url: movie.poster || undefined,
                input_message_content: {
                    message_text: `🎬 <b>${movie.title}</b> (${movie.year || 'N/A'})\n\n🎭 Janr: ${movie.genre || 'Noma\'lum'}\n📝 ${movie.description || ''}\n\n📥 Kino kodi: <code>${movie.code}</code>`,
                    parse_mode: 'HTML'
                },
                reply_markup: Markup.inlineKeyboard([
                    [Markup.button.url('🎬 Kinoni botda ko\'rish', `https://t.me/${ctx.botInfo.username}?start=${movie.code}`)]
                ]).reply_markup
            }));

            await ctx.answerInlineQuery(results, { cache_time: 10 });
        } catch (e) {
            logger.error('Inline search error:', e);
            ctx.answerInlineQuery([]).catch(() => { });
        }
    });
};
