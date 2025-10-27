// jobs/matchCronJob.js
import cron from 'node-cron';
import { User } from '../models/user.model.js';
import AutomatedNotificationService from '../services/automatedNotification.service.js';
import NotificationService from '../services/notifications.service.js';

class MatchCronJob {
    constructor() {
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) {
            console.log('Cron job already running');
            return;
        }

        // Run every 5 minutes: "*/5 * * * *"
        cron.schedule('*/5 * * * *', async () => {
            console.log('🕒 Running scheduled match check...');
            try {
                await AutomatedNotificationService.checkNewPosts();
            } catch (error) {
                console.error('Error in scheduled match check:', error);
            }
        });

        // Weekly summary every Monday at 9 AM: "0 9 * * 1"
        cron.schedule('0 9 * * 1', async () => {
            console.log('📊 Running weekly summary...');
            try {
                await this.sendWeeklySummaries();
            } catch (error) {
                console.error('Error in weekly summary:', error);
            }
        });

        this.isRunning = true;
        console.log('✅ Match cron jobs started');
    }

    async sendWeeklySummaries() {
        try {
            // Get all active users who want summaries
            const users = await User.find({ 
                'notificationPreferences.summary': true 
            });

            console.log(`📧 Sending weekly summaries to ${users.length} users`);

            for (const user of users) {
                try {
                    await NotificationService.sendWeeklyMatchSummary(user._id);
                    console.log(`✅ Sent weekly summary to ${user.email}`);
                } catch (error) {
                    console.error(`❌ Error sending weekly summary to ${user.email}:`, error);
                }
            }

            console.log('✅ Weekly summaries completed');
        } catch (error) {
            console.error('Error in sendWeeklySummaries:', error);
        }
    }

    stop() {
        this.isRunning = false;
        console.log('🛑 Cron jobs stopped');
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            jobs: ['match_check', 'weekly_summary']
        };
    }
}

export default new MatchCronJob();