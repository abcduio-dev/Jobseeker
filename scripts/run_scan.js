#!/usr/bin/env node

/**
 * Melbourne JobSeeker - CLI Scan & Notify Runner
 * Usage:
 *   node scripts/run_scan.js           # Run scan and save to database
 *   node scripts/run_scan.js --notify  # Run scan and send email digest to recipient
 */

const { runJobScan } = require('../server/scanners');
const { sendJobDigestEmail } = require('../server/email/mailer');

async function main() {
  const shouldNotify = process.argv.includes('--notify');
  console.log('--------------------------------------------------');
  console.log('🇦🇺 Melbourne JobSeeker - Command Line Runner');
  console.log(`Mode: Scan ${shouldNotify ? '+ Email Notification' : 'Only'}`);
  console.log('--------------------------------------------------');

  try {
    const scanResult = await runJobScan();
    console.log(`✅ Scan finished successfully!`);
    console.log(`Total jobs active: ${scanResult.totalInDb}`);
    console.log(`New jobs discovered: ${scanResult.newJobsAdded}`);

    if (shouldNotify) {
      console.log('\n📧 Preparing email digest...');
      const emailResult = await sendJobDigestEmail();
      if (emailResult.success) {
        console.log(`✅ Email sent to ${emailResult.recipient} (${emailResult.jobsCount} jobs).`);
      } else {
        console.warn(`⚠️ Email not sent: ${emailResult.error}`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during execution:', err);
    process.exit(1);
  }
}

main();
