const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API Routes
app.post('/api/submit-answers', async (req, res) => {
  try {
    const { gender, answers } = req.body;

    if (!gender || !answers) {
      return res.status(400).json({ error: 'Gender and answers are required' });
    }

    // Validate age and height if provided
    if (answers.age) {
      const age = parseInt(answers.age);
      if (isNaN(age) || age < 18 || age > 100) {
        return res.status(400).json({ error: 'Age must be between 18 and 100' });
      }
    }
    if (answers.height) {
      const height = parseInt(answers.height);
      if (isNaN(height) || height < 100 || height > 250) {
        return res.status(400).json({ error: 'Height must be between 100 and 250 cm' });
      }
    }

    // Generate unique code
    let code;
    let attempts = 0;
    const maxAttempts = 10;

    const generateUniqueCode = () => {
      code = '';
      for (let i = 0; i < 12; i++) {
        code += Math.floor(Math.random() * 36).toString(36).toUpperCase();
      }
      return code;
    };

    // Local storage file
    const dataFile = path.join(__dirname, 'data.json');

    // Load existing data
    let data = {};
    if (fs.existsSync(dataFile)) {
      data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    }

    const tryInsert = async () => {
      code = generateUniqueCode();

      // Check if code already exists
      if (data[`user:${code}`]) {
        if (attempts < maxAttempts) {
          attempts++;
          return tryInsert();
        } else {
          throw new Error('Could not generate unique code');
        }
      }

      // Store user data
      data[`user:${code}`] = {
        gender,
        answers,
        created_at: new Date().toISOString()
      };

      // Save to file
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

      return code;
    };

    const finalCode = await tryInsert();

    res.json({ code: finalCode });

  } catch (error) {
    console.error('Error in submit-answers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/check-match', async (req, res) => {
  try {
    const { code1, code2 } = req.body;

    if (!code1 || !code2) {
      return res.status(400).json({ error: 'Both codes are required' });
    }

    // Local storage file
    const dataFile = path.join(__dirname, 'data.json');

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

    // Calculate compatibility scores
    const sections = ['deen', 'character', 'family', 'finance', 'education', 'relationship', 'lifestyle'];
    const secScores = {};
    let totalScore = 0;

    sections.forEach(sec => {
      const q1 = user1.answers[sec];
      const q2 = user2.answers[sec];

      if (q1 !== undefined && q2 !== undefined) {
        // Simple compatibility calculation (0-4 scale)
        const diff = Math.abs(q1 - q2);
        const score = Math.max(0, 100 - (diff * 25)); // 0 diff = 100%, 4 diff = 0%
        secScores[sec] = Math.round(score);
        totalScore += score;
      } else {
        secScores[sec] = 50; // Default if not answered
        totalScore += 50;
      }
    });

    const overallScore = Math.round(totalScore / sections.length);

    // Generate insights based on scores
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
    sections.forEach(sec => {
      const score = secScores[sec];
      if (score >= 75) {
        insights.push({ type: 'positive', text: `Strong alignment in ${sec} values.` });
      } else if (score <= 25) {
        insights.push({ type: 'warning', text: `Notable differences in ${sec} expectations.` });
      }
    });

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

    res.json({
      overallScore,
      sectionScores: secScores,
      insights,
      badge
    });

  } catch (error) {
    console.error('Error in check-match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NikahFit server running on http://localhost:${PORT}`);
});