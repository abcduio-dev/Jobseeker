const cron = require('node-cron');
const db = require('./db');
const { runJobScan } = require('./scanners');
const { sendJobDigestEmail } = require('./email/mailer');

class Scheduler {
  constructor() {
    this.cronTask = null;
    this.isRunning = false;
    this.lastRunTime = null;
    this.currentExpression = null;
  }

  buildCronExpression(scheduleConfig) {
    const { frequency = 'daily', timeOfDay = '08:30', dayOfWeek = 1 } = scheduleConfig;
    const [rawHour, rawMinute] = timeOfDay.split(':');
    const hour = parseInt(rawHour || '8', 10);
    const minute = parseInt(rawMinute || '30', 10);

    switch (frequency) {
      case 'twice_daily': {
        const secondHour = (hour + 10) % 24;
        return `${minute} ${hour},${secondHour} * * *`;
      }
      case 'every_6_hours':
        return `${minute} */6 * * *`;
      case 'every_12_hours':
        return `${minute} */12 * * *`;
      case 'weekly':
        return `${minute} ${hour} * * ${dayOfWeek}`;
      case 'daily':
      default:
        return `${minute} ${hour} * * *`;
    }
  }

  start() {
    const settings = db.getSettings();
    const schedule = settings.schedule || {};

    if (!schedule.enabled) {
      console.log('[Scheduler] Automated schedule is disabled in settings.');
      return;
    }

    const expression = this.buildCronExpression(schedule);
    const timezone = schedule.timezone || 'Australia/Melbourne';

    if (this.cronTask) {
      this.cronTask.stop();
    }

    try {
      this.cronTask = cron.schedule(
        expression,
        async () => {
          console.log(`[Scheduler] Cron trigger activated at Melbourne time (${expression})`);
          await this.executeScanAndNotify('scheduled');
        },
        {
          scheduled: true,
          timezone
        }
      );

      this.currentExpression = expression;
      console.log(`[Scheduler] Active: "${expression}" in timezone ${timezone}`);
    } catch (err) {
      console.error('[Scheduler] Failed to schedule cron:', err.message);
    }
  }

  async executeScanAndNotify(triggerType = 'manual') {
    if (this.isRunning) {
      console.log('[Scheduler] Scan already in progress. Skipping duplicate execution.');
      return { status: 'already_running' };
    }

    this.isRunning = true;
    this.lastRunTime = new Date().toISOString();

    try {
      console.log(`[Scheduler] Starting scan cycle (trigger: ${triggerType})...`);
      const scanResult = await runJobScan();

      // Check if email notification is enabled
      const settings = db.getSettings();
      let emailResult = null;

      if (settings.email?.enabled && settings.email?.to) {
        console.log(`[Scheduler] Preparing to dispatch email digest to ${settings.email.to}...`);
        emailResult = await sendJobDigestEmail();
      } else {
        console.log('[Scheduler] Email dispatch skipped (not enabled or no recipient).');
      }

      return {
        status: 'completed',
        scan: scanResult,
        email: emailResult,
        timestamp: this.lastRunTime
      };
    } catch (err) {
      console.error('[Scheduler] Error in scan cycle:', err.message);
      return { status: 'error', error: err.message };
    } finally {
      this.isRunning = false;
    }
  }

  reschedule() {
    console.log('[Scheduler] Re-evaluating schedule parameters...');
    this.start();
  }

  getStatus() {
    const settings = db.getSettings();
    const schedule = settings.schedule || {};
    return {
      enabled: !!schedule.enabled,
      frequency: schedule.frequency || 'daily',
      timeOfDay: schedule.timeOfDay || '08:30',
      timezone: schedule.timezone || 'Australia/Melbourne',
      expression: this.currentExpression,
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime
    };
  }
}

module.exports = new Scheduler();
