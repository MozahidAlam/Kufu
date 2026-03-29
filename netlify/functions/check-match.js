// Netlify serverless function for checking compatibility
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { code1, code2 } = JSON.parse(event.body);

    if (!code1 || !code2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Both codes are required' })
      };
    }

    // Fetch user data from Supabase
    const { data: user1Data, error: error1 } = await supabase
      .from('users')
      .select('*')
      .eq('code', code1)
      .single();

    const { data: user2Data, error: error2 } = await supabase
      .from('users')
      .select('*')
      .eq('code', code2)
      .single();

    if (!user1Data || !user2Data) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'One or both codes not found' })
      };
    }

    const user1 = user1Data;
    const user2 = user2Data;

    if (user1.gender === user2.gender) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Codes must be from different genders' })
      };
    }

    const compatibility = calculateCompatibility(user1.answers, user2.answers);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(compatibility)
    };

  } catch (error) {
    console.error('Error in check-match:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

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

  // Determine badge
  let badge;
  if (overallScore >= 80) {
    badge = { title: 'Excellent Match', desc: 'Outstanding compatibility across all areas' };
  } else if (overallScore >= 60) {
    badge = { title: 'Good Match', desc: 'Solid foundation with some areas to discuss' };
  } else if (overallScore >= 40) {
    badge = { title: 'Moderate Match', desc: 'Compatible with effort and understanding' };
  } else {
    badge = { title: 'Needs Discussion', desc: 'Significant differences require careful consideration' };
  }

  return {
    overallScore,
    sectionScores,
    insights,
    badge
  };
}

// Get questions for a specific section
function getQuestionsForSection(section, answers1, answers2) {
  // This is a simplified version - you should match the actual question structure from your HTML
  const questionMap = {
    deen: [
      { id: 'deen1', opts: [{ v: 1, sc: 1 }, { v: 2, sc: 2 }, { v: 3, sc: 3 }, { v: 4, sc: 4 }] },
      { id: 'deen2', opts: [{ v: 1, sc: 1 }, { v: 2, sc: 2 }, { v: 3, sc: 3 }, { v: 4, sc: 4 }] },
      { id: 'deen3', opts: [{ v: 1, sc: 1 }, { v: 2, sc: 2 }, { v: 3, sc: 3 }, { v: 4, sc: 4 }] },
      { id: 'deen4', opts: [{ v: 1, sc: 1 }, { v: 2, sc: 2 }, { v: 3, sc: 3 }, { v: 4, sc: 4 }] },
      { id: 'deen5', opts: [{ v: 1, sc: 1 }, { v: 2, sc: 2 }, { v: 3, sc: 3 }, { v: 4, sc: 4 }] }
    ],
    character: [
      { id: 'char1', opts: [{ v: 1, sc: 1 }, { v: 2, sc: 2 }, { v: 3, sc: 3 }, { v: 4, sc: 4 }] },
      { id: 'char2', opts: [{ v: 1, sc: 1 }, { v: 2, sc: 2 }, { v: 3, sc: 3 }, { v: 4, sc: 4 }] },
      { id: 'char3', opts: [{ v: 1, sc: 1 }, { v: 2, sc: 2 }, { v: 3, sc: 3 }, { v: 4, sc: 4 }] }
    ],
    family: [
      { id: 'fam1', opts: [{ v: 1, sc: 1 }, { v: 2, sc: 2 }, { v: 3, sc: 3 }, { v: 4, sc: 4 }] },
      { id: 'fam2', opts: [{ v: 1, sc: 1 }, { v: 2, sc: 2 }, { v: 3, sc: 3 }, { v: 4, sc: 4 }] },
      { id: 'fam3', opts: [{ v: 1, sc: 1 }, { v: 2, sc: 2 }, { v: 3, sc: 3 }, { v: 4, sc: 4 }] }
    ],
    finance: [
      { id: 'fin1', opts: [{ v: 1, sc: 1 }, { v: 2, sc: 2 }, { v: 3, sc: 3 }, { v: 4, sc: 4 }] },
      { id: 'fin2', opts: [{ v: 1, sc: 1 }, { v: 2, sc: 2 }, { v: 3, sc: 3 }, { v: 4, sc: 4 }] }
    ],
    education: [
      { id: 'edu1', opts: [{ v: 1, sc: 1 }, { v: 2, sc: 2 }, { v: 3, sc: 3 }, { v: 4, sc: 4 }] },
      { id: 'edu2', opts: [{ v: 1, sc: 1 }, { v: 2, sc: 2 }, { v: 3, sc: 3 }, { v: 4, sc: 4 }] }
    ],
    relationship: [
      { id: 'rel1', opts: [{ v: 1, sc: 1 }, { v: 2, sc: 2 }, { v: 3, sc: 3 }, { v: 4, sc: 4 }] },
      { id: 'rel2', opts: [{ v: 1, sc: 1 }, { v: 2, sc: 2 }, { v: 3, sc: 3 }, { v: 4, sc: 4 }] }
    ],
    lifestyle: [
      { id: 'life1', opts: [{ v: 1, sc: 1 }, { v: 2, sc: 2 }, { v: 3, sc: 3 }, { v: 4, sc: 4 }] },
      { id: 'life2', opts: [{ v: 1, sc: 1 }, { v: 2, sc: 2 }, { v: 3, sc: 3 }, { v: 4, sc: 4 }] }
    ]
  };

  return questionMap[section] || [];
}

// Generate insights based on scores
function generateInsights(sectionScores, overallScore) {
  const insights = [];

  if (overallScore >= 80) {
    insights.push({ type: 'positive', text: 'Excellent compatibility! You share strong alignment in core values.' });
  } else if (overallScore >= 60) {
    insights.push({ type: 'positive', text: 'Good compatibility with room for growth and understanding.' });
  } else if (overallScore >= 40) {
    insights.push({ type: 'warning', text: 'Moderate compatibility. Consider discussing differences openly.' });
  } else {
    insights.push({ type: 'warning', text: 'Significant differences in values. Seek guidance from family and scholars.' });
  }

  // Add section-specific insights
  Object.entries(sectionScores).forEach(([section, score]) => {
    if (score >= 75) {
      insights.push({ type: 'positive', text: `Strong alignment in ${section} values.` });
    } else if (score <= 25) {
      insights.push({ type: 'warning', text: `Notable differences in ${section} expectations.` });
    }
  });

  return insights;
}
