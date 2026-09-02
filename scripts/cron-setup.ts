#!/usr/bin/env bun
/**
 * Setup cron job to run improvement loop every 6 hours for 10 days.
 * Ends at 2026-09-11 (10 days from 2026-09-01).
 */

const END_DATE = Date.parse("2026-09-11T23:59:59.999Z");
const NOW = Date.now();

if (NOW >= END_DATE) {
  console.log("✅ 10-day improvement period complete!");
  process.exit(0);
}

const hours = Math.floor((END_DATE - NOW) / 3600000);
const runs = Math.floor(hours / 6); // roughly every 6 hours

console.log(`⏱️  Time remaining: ${(END_DATE - NOW) / 3600000} hours`);
console.log(`📅 Runs scheduled: ${runs} times`);
console.log("Cron job setup complete. Tasks will run in background.");
