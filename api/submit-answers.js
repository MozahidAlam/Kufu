// Vercel serverless function for submitting answers
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

    // Local storage file (use /tmp for Vercel serverless)
    const dataFile = path.join('/tmp', 'data.json');

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
}