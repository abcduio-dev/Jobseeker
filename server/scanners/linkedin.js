const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function estimateMelbourneSalary(title) {
  const t = title.toLowerCase();
  if (t.includes('lead') || t.includes('principal') || t.includes('head') || t.includes('manager')) {
    return { min: 160000, max: 200000, label: '$160,000 - $200,000 + Super (Est. Lead Level)' };
  }
  if (t.includes('senior') || t.includes('sr.') || t.includes('sr ')) {
    return { min: 135000, max: 165000, label: '$135,000 - $165,000 + Super (Est. Senior Range)' };
  }
  if (t.includes('engineer') || t.includes('architect')) {
    return { min: 130000, max: 160000, label: '$130,000 - $160,000 + Super (Market Rate)' };
  }
  if (t.includes('junior') || t.includes('graduate') || t.includes('associate')) {
    return { min: 80000, max: 100000, label: '$80,000 - $100,000 + Super (Junior/Entry)' };
  }
  return { min: 110000, max: 135000, label: '$110,000 - $135,000 + Super (Market Mid-Level)' };
}

function extractTags(text) {
  const common = ['SQL', 'Power BI', 'Tableau', 'Python', 'R', 'Snowflake', 'AWS', 'Azure', 'GCP', 'dbt', 'Databricks', 'BigQuery', 'Excel', 'ETL', 'Machine Learning'];
  const found = [];
  const lower = text.toLowerCase();
  for (const skill of common) {
    if (lower.includes(skill.toLowerCase())) {
      found.push(skill);
    }
  }
  return found.slice(0, 5);
}

async function scrapeLinkedInJobs(keyword, location = 'Melbourne, Victoria, Australia', limit = 10) {
  try {
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&start=0`;
    
    const res = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept-Language': 'en-AU,en-US;q=0.9,en;q=0.8'
      },
      timeout: 10000
    });

    if (res.status !== 200 || !res.data) {
      return [];
    }

    const $ = cheerio.load(res.data);
    const jobs = [];

    $('li').each((i, el) => {
      if (jobs.length >= limit) return false;

      const title = $(el).find('.base-search-card__title').text().trim();
      const company = $(el).find('.base-search-card__subtitle').text().trim();
      const jobLocation = $(el).find('.job-search-card__location').text().trim() || location;
      const fullLink = $(el).find('.base-card__full-link').attr('href') || '';
      const dateStr = $(el).find('time').attr('datetime') || $(el).find('time').text().trim();

      if (!title || !company) return;

      // Extract LinkedIn job ID from URL
      const idMatch = fullLink.match(/\/view\/.*?(\d+)/) || fullLink.match(/-(\d+)\?/);
      const jobId = idMatch ? `li_${idMatch[1]}` : 'li_' + crypto.createHash('md5').update(title + company).digest('hex').substring(0, 10);

      const salaryEst = estimateMelbourneSalary(title);
      const tags = extractTags(`${title} ${company}`);
      if (!tags.includes('Melbourne')) tags.unshift('Melbourne');

      const postedTimestamp = dateStr ? new Date(dateStr).getTime() : Date.now();

      jobs.push({
        id: jobId,
        title,
        company,
        location: jobLocation,
        salary: salaryEst.label,
        salaryMin: salaryEst.min,
        salaryMax: salaryEst.max,
        postDate: dateStr || 'Recently posted',
        postedTimestamp: isNaN(postedTimestamp) ? Date.now() : postedTimestamp,
        description: `Join ${company} in ${jobLocation} as a ${title}. Focus on delivering impactful data analytics, business intelligence dashboards, and data-driven insights.`,
        url: fullLink,
        source: 'LinkedIn AU',
        tags,
        workType: jobLocation.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid'
      });
    });

    // Optionally fetch detailed snippets for the first 3 jobs
    for (let i = 0; i < Math.min(jobs.length, 3); i++) {
      const job = jobs[i];
      const match = job.id.match(/^li_(\d+)$/);
      if (match) {
        try {
          const detailRes = await axios.get(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${match[1]}`, {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 5000
          });
          if (detailRes.status === 200 && detailRes.data) {
            const $d = cheerio.load(detailRes.data);
            const desc = $d('.show-more-less-html__markup').text().trim().replace(/\s+/g, ' ');
            if (desc && desc.length > 50) {
              job.description = desc.substring(0, 320) + '...';
              const detailedTags = extractTags(desc);
              job.tags = Array.from(new Set([...job.tags, ...detailedTags])).slice(0, 5);
            }
          }
        } catch (detailErr) {
          // Non-critical, continue
        }
      }
    }

    return jobs;
  } catch (err) {
    console.error(`LinkedIn scanner error for "${keyword}":`, err.message);
    return [];
  }
}

module.exports = {
  scrapeLinkedInJobs
};
