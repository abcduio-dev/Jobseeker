const axios = require('axios');

async function fetchRemotiveJobs(keywords = []) {
  try {
    const url = 'https://remotive.com/api/remote-jobs?category=data&limit=25';
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'MelbourneJobSeeker/1.0' },
      timeout: 8000
    });

    if (!res.data || !res.data.jobs) {
      return [];
    }

    const keywordList = keywords.map(k => k.toLowerCase());

    const filtered = res.data.jobs.filter(job => {
      const geo = (job.candidate_required_location || '').toLowerCase();
      // Match Australia, APAC, ANZ, or Worldwide / Anywhere
      const isAULocation = geo.includes('australia') || geo.includes('melbourne') || geo.includes('apac') || geo.includes('anywhere') || geo.includes('worldwide');
      
      const titleLower = (job.title || '').toLowerCase();
      const matchesKeyword = keywordList.some(k => titleLower.includes(k) || (k.includes('data') && titleLower.includes('data')));
      
      return isAULocation && matchesKeyword;
    });

    return filtered.map(item => {
      let salaryMin = null;
      let salaryMax = null;
      let salaryLabel = item.salary || 'Competitive Remote (AUD Equiv)';

      const numMatches = (item.salary || '').match(/\$?\s*(\d{2,3})[,\.]?(\d{3})?/g);
      if (numMatches && numMatches.length > 0) {
        const clean = numMatches.map(s => parseInt(s.replace(/[^0-9]/g, ''), 10)).filter(n => n > 20000);
        if (clean.length > 0) salaryMin = Math.min(...clean);
        if (clean.length > 1) salaryMax = Math.max(...clean);
      }

      return {
        id: `remotive_${item.id}`,
        title: item.title,
        company: item.company_name,
        location: `Remote (${item.candidate_required_location || 'Australia / APAC'})`,
        salary: salaryLabel,
        salaryMin: salaryMin || 115000,
        salaryMax: salaryMax || 155000,
        postDate: item.publication_date ? item.publication_date.substring(0, 10) : 'Recently',
        postedTimestamp: item.publication_date ? new Date(item.publication_date).getTime() : Date.now(),
        description: (item.description || '').replace(/<\/?[^>]+(>|$)/g, '').substring(0, 320) + '...',
        url: item.url,
        source: 'Remotive Global/AU',
        tags: Array.isArray(item.tags) ? item.tags.slice(0, 4) : ['Remote', 'Data'],
        workType: 'Remote'
      };
    });
  } catch (err) {
    console.error('Remotive scanner error:', err.message);
    return [];
  }
}

module.exports = {
  fetchRemotiveJobs
};
