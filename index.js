import express from 'express';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import bot from './src/bot/bot.js';

dotenv.config();

// Main startup function
const startBot = async () => {
    try {
        const app = express();
        const PORT = process.env.PORT || 3000;
        
        // Attempt DB Connection in background, don't crash the server if it fails
        connectDB()
            .then(() => console.log('✅ Database connected'))
            .catch(err => console.error('❌ Database connection failed:', err.message));

        // Add Commands definition
        try {
            await bot.telegram.setMyCommands([
                { command: 'start', description: 'Bosh Menyu (Restart)' },
                { command: 'help', description: 'Yordam' }
            ]);
            console.log('✅ Commands menu updated successfully');
        } catch (e) {
            console.log('❌ Commands update error:', e.message);
        }

        app.get('/', (req, res) => {
            res.send('🎥 FilmXBot is running...');
        });

        app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date() });
        });

        // Setup Webhook or Long Polling based on Environment
        const domain = process.env.RENDER_EXTERNAL_URL;
        
        if (domain) {
            // Render specific: Use Webhooks
            const webhookPath = `/telegraf/${bot.secretPathComponent()}`;
            app.use(bot.webhookCallback(webhookPath));
            
            app.listen(PORT, async () => {
                console.log(`🌐 Server (Webhook) running on port ${PORT}`);
                try {
                    await bot.telegram.setWebhook(`${domain}${webhookPath}`);
                    console.log('🤖 Bot webhook configured successfully!');
                } catch (e) {
                    console.error('❌ Webhook setup failed:', e.message);
                }
            });
        } else {
            // Local fallback: Long Polling
            app.listen(PORT, () => {
                console.log(`🌐 Server (Polling) running on port ${PORT}`);
            });
            
            try {
                await bot.launch();
                console.log('🤖 Bot started successfully! (Long Polling)');
            } catch (err) {
                console.error('❌ Bot startup failed:', err.message);
            }
        }
        
    } catch (err) {
        console.error('❌ Startup failed:', err);
    }
};

// Start the application
startBot();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Prevent Crash on Unhandled Errors
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
    // Don't exit, keep running
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // Don't exit, keep running
});
