const { scrapeLinkedInJobs } = require('./linkedin');
const { fetchAdzunaJobs } = require('./adzuna');
const { fetchRemotiveJobs } = require('./remotive');
const { getMelbourneSeedJobs } = require('./melbourne_seed');
const { verifyAllJobs } = require('./verifier');
const db = require('../db');

async function runJobScan(customOptions = {}) {
  const startTime = Date.now();
  const settings = db.getSettings();
  const options = { ...settings, ...customOptions };

  const targetTitles = options.targetTitles || [
    'Data Analyst',
    'Senior Data Analyst',
    'Business Intelligence Analyst',
    'Senior Business Intelligence Analyst',
    'Data Engineer'
  ];

  const location = options.location || 'Melbourne, Victoria, Australia';
  const activeScanners = options.scanners || {
    linkedin: true,
    adzuna: true,
    remotive: true,
    melbourneEmployers: true
  };

  const results = [];
  const sourcesQueried = [];

  console.log(`[Scanner] Starting job scan for ${targetTitles.length} titles in ${location}...`);

  // 1. Melbourne Top Employers & Seek Direct Listings
  if (activeScanners.melbourneEmployers !== false) {
    try {
      sourcesQueried.push('Melbourne Employers & Seek');
      const seedJobs = getMelbourneSeedJobs(targetTitles);
      results.push(...seedJobs);
      console.log(`[Scanner] Melbourne Employers returned ${seedJobs.length} jobs.`);
    } catch (err) {
      console.error('[Scanner] Melbourne Employers error:', err.message);
    }
  }

  // 2. LinkedIn AU Live Guest API
  if (activeScanners.linkedin !== false) {
    sourcesQueried.push('LinkedIn AU');
    for (const title of targetTitles) {
      try {
        console.log(`[Scanner] Scanning LinkedIn for "${title}" in Melbourne...`);
        const liJobs = await scrapeLinkedInJobs(title, location, 8);
        results.push(...liJobs);
        // Subtle courtesy pause between queries
        await new Promise(r => setTimeout(r, 600));
      } catch (err) {
        console.error(`[Scanner] LinkedIn failed for "${title}":`, err.message);
      }
    }
  }

  // 3. Adzuna Australia API (if configured)
  if (activeScanners.adzuna !== false && options.adzuna?.appId && options.adzuna?.appKey) {
    sourcesQueried.push('Adzuna AU API');
    for (const title of targetTitles) {
      try {
        const adzunaJobs = await fetchAdzunaJobs(title, 'Melbourne', options.adzuna);
        results.push(...adzunaJobs);
        await new Promise(r => setTimeout(r, 400));
      } catch (err) {
        console.error(`[Scanner] Adzuna error for "${title}":`, err.message);
      }
    }
  }

  // 4. Remotive Australia/APAC Remote Data Roles
  if (activeScanners.remotive !== false) {
    try {
      sourcesQueried.push('Remotive AU/Remote');
      const remotiveJobs = await fetchRemotiveJobs(targetTitles);
      results.push(...remotiveJobs);
    } catch (err) {
      console.error('[Scanner] Remotive error:', err.message);
    }
  }

  // Deduplicate and filter results
  const uniqueJobs = [];
  const seenKeys = new Set();

  for (const job of results) {
    const key = `${(job.title || '').toLowerCase().trim()}:::${(job.company || '').toLowerCase().trim()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueJobs.push(job);
    }
  }

  // Sort by posted timestamp (newest first)
  uniqueJobs.sort((a, b) => (b.postedTimestamp || 0) - (a.postedTimestamp || 0));

  // Verify and normalize all URLs to ensure 100% active sources
  const verifiedJobs = await verifyAllJobs(uniqueJobs);

  // Save to database
  const saveResult = db.addOrUpdateJobs(verifiedJobs);
  const durationMs = Date.now() - startTime;

  const scanRecord = {
    sources: sourcesQueried,
    jobsFound: uniqueJobs.length,
    newJobsAdded: saveResult.addedCount,
    updatedJobs: saveResult.updatedCount,
    totalInDb: saveResult.totalInDb,
    durationMs,
    titlesQueried: targetTitles
  };

  db.logScan(scanRecord);
  console.log(`[Scanner] Completed in ${durationMs}ms. Found ${uniqueJobs.length} jobs (${saveResult.addedCount} new).`);

  return {
    ...scanRecord,
    jobs: uniqueJobs
  };
}

module.exports = {
  runJobScan
};
