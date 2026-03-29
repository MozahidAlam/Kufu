// Vercel serverless function for checking compatibility
const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code1, code2 } = req.body;

    if (!code1 || !code2) {
      return res.status(400).json({ error: 'Both codes are required' });
    }

    // Local storage file (use /tmp for Vercel serverless)
    const dataFile = path.join('/tmp', 'data.json');

    // Load existing data
    let data = {};
    if (fs.existsSync(dataFile)) {
      data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    }

    // Fetch user data
    const user1Data = data[`user:${code1}`];
    const user2Data = data[`user:${code2}`];

    if (!user1Data || !user2Data) {
      return res.status(404).json({ error: 'One or both codes not found' });
    }

    const user1 = user1Data;
    const user2 = user2Data;

    if (user1.gender === user2.gender) {
      return res.status(400).json({ error: 'Codes must be from different genders' });
    }

    const compatibility = calculateCompatibility(user1.answers, user2.answers);

    res.json(compatibility);

  } catch (error) {
    console.error('Error in check-match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Calculate compatibility score
function calculateCompatibility(answers1, answers2) {
  const sections = ['deen', 'character', 'family', 'finance', 'education', 'relationship', 'lifestyle'];
  const weights = { deen: 40, character: 20, family: 15, finance: 10, education: 5, relationship: 5, lifestyle: 5 };

  let totalScore = 0;
  let maxScore = 0;
  const sectionScores = {};

  sections.forEach(section => {
    const weight = weights[section];
    const questions = getQuestionsForSection(section, answers1, answers2);

    let sectionScore = 0;
    let sectionMax = 0;

    questions.forEach(q => {
      const ans1 = answers1[q.id];
      const ans2 = answers2[q.id];

      if (ans1 && ans2) {
        const score1 = q.opts.find(o => o.v === ans1)?.sc || 0;
        const score2 = q.opts.find(o => o.v === ans2)?.sc || 0;
        const diff = Math.abs(score1 - score2);
        const compatibilityScore = Math.max(0, 4 - diff); // 0-4 scale
        sectionScore += compatibilityScore;
        sectionMax += 4;
      }
    });

    const sectionPct = sectionMax > 0 ? (sectionScore / sectionMax) * 100 : 0;
    sectionScores[section] = Math.round(sectionPct);
    totalScore += (sectionPct / 100) * weight;
    maxScore += weight;
  });

  const overallScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // Generate insights
  const insights = generateInsights(sectionScores, overallScore);

  return {
    overallScore,
    sectionScores,
    insights,
    badge: getBadge(overallScore)
  };
}

// Get questions for a section (simplified version)
function getQuestionsForSection(section, answers1, answers2) {
  // This is a simplified version - in production you'd want the full question data
  const questionTemplates = {
    deen: [
      {id:'salah', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1},{v:'e',sc:0}]},
      {id:'fasting', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'quran', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'dress_m', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'hijab', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'deen_imp', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'spouse_deen', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'haram', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'islamic_know', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]}
    ],
    character: [
      {id:'anger', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'honesty', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'patience', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'decision', opts:[{v:'a',sc:4},{v:'b',sc:4},{v:'c',sc:2},{v:'d',sc:2}]},
      {id:'forgiveness', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'empathy', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'personality', opts:[{v:'a',sc:3},{v:'b',sc:4},{v:'c',sc:3},{v:'d',sc:2}]},
      {id:'ego', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]}
    ],
    family: [
      {id:'fam_sys', opts:[{v:'a',sc:3},{v:'b',sc:3},{v:'c',sc:4},{v:'d',sc:4}]},
      {id:'inlaws', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'fam_role', opts:[{v:'a',sc:3},{v:'b',sc:4},{v:'c',sc:2}]},
      {id:'children', opts:[{v:'a',sc:3},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:4}]},
      {id:'parenting', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:3},{v:'d',sc:1}]},
      {id:'parents_care', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'family_planning', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]}
    ],
    finance: [
      {id:'income', opts:[{v:'a',sc:1},{v:'b',sc:2},{v:'c',sc:3},{v:'d',sc:4},{v:'e',sc:5}]},
      {id:'stability', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'expenses', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'savings_m', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'debt_m', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'fam_finance', opts:[{v:'a',sc:1},{v:'b',sc:2},{v:'c',sc:3},{v:'d',sc:4},{v:'e',sc:5}]},
      {id:'income_exp', opts:[{v:'a',sc:2},{v:'b',sc:4},{v:'c',sc:3},{v:'d',sc:4}]},
      {id:'mahr', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:4}]},
      {id:'savings_f', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]}
    ],
    education: [
      {id:'career_goal', opts:[{v:'a',sc:3},{v:'b',sc:4},{v:'c',sc:3},{v:'d',sc:2}]},
      {id:'work_after_f', opts:[{v:'a',sc:3},{v:'b',sc:4},{v:'c',sc:3},{v:'d',sc:3},{v:'e',sc:4}]},
      {id:'wife_work_m', opts:[{v:'a',sc:2},{v:'b',sc:4},{v:'c',sc:3},{v:'d',sc:4}]},
      {id:'edu_pref', opts:[{v:'a',sc:2},{v:'b',sc:3},{v:'c',sc:3},{v:'d',sc:2}]}
    ],
    relationship: [
      {id:'most_imp', opts:[{v:'a',sc:4},{v:'b',sc:4},{v:'c',sc:2},{v:'d',sc:3},{v:'e',sc:4}]},
      {id:'conflict_res', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:3},{v:'d',sc:1}]},
      {id:'communication', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2}]},
      {id:'romance', opts:[{v:'a',sc:3},{v:'b',sc:4},{v:'c',sc:3},{v:'d',sc:2}]},
      {id:'quality_time', opts:[{v:'a',sc:3},{v:'b',sc:4},{v:'c',sc:3},{v:'d',sc:2}]},
      {id:'respect_spouse', opts:[{v:'a',sc:4},{v:'b',sc:4},{v:'c',sc:2},{v:'d',sc:3}]}
    ],
    lifestyle: [
      {id:'social_media', opts:[{v:'a',sc:1},{v:'b',sc:3},{v:'c',sc:4},{v:'d',sc:4}]},
      {id:'entertainment', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'travel', opts:[{v:'a',sc:3},{v:'b',sc:4},{v:'c',sc:4},{v:'d',sc:2}]},
      {id:'routine', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'diet', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:1}]},
      {id:'finance_mgmt', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2},{v:'d',sc:1}]},
      {id:'health_lifestyle', opts:[{v:'a',sc:4},{v:'b',sc:3},{v:'c',sc:2}]}
    ]
  };

  return questionTemplates[section] || [];
}

// Generate insights based on scores
function generateInsights(sectionScores, overallScore) {
  const insights = [];

  if (sectionScores.deen < 70) {
    insights.push({ type: 'warning', text: 'Religious practice differences may need discussion and mutual growth.' });
  } else {
    insights.push({ type: 'positive', text: 'Strong alignment in Deen and religious values.' });
  }

  if (sectionScores.character < 70) {
    insights.push({ type: 'warning', text: 'Character and personality differences should be addressed early.' });
  } else {
    insights.push({ type: 'positive', text: 'Compatible character traits and decision-making styles.' });
  }

  if (sectionScores.family < 70) {
    insights.push({ type: 'neutral', text: 'Family values alignment needs open communication.' });
  }

  if (sectionScores.finance < 70) {
    insights.push({ type: 'warning', text: 'Financial expectations and stability should be discussed.' });
  }

  if (overallScore >= 80) {
    insights.push({ type: 'positive', text: 'Overall excellent compatibility! May Allah bless your union.' });
  } else if (overallScore >= 60) {
    insights.push({ type: 'neutral', text: 'Good foundation with some areas for improvement.' });
  } else {
    insights.push({ type: 'warning', text: 'Significant differences found. Consider counseling.' });
  }

  return insights;
}

// Get compatibility badge
function getBadge(score) {
  if (score >= 85) return { level: 'excellent', title: 'Excellent Match!', desc: 'MashaAllah! Strong compatibility across all areas.' };
  if (score >= 70) return { level: 'good', title: 'Good Match', desc: 'AlHamdulillah! Good alignment with minor differences.' };
  if (score >= 50) return { level: 'moderate', title: 'Moderate Match', desc: 'Some compatibility with areas needing work.' };
  return { level: 'poor', title: 'Low Compatibility', desc: 'Significant differences in key areas.' };
}