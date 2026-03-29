// Vercel serverless function for submitting answers
const { createClient } = require('@vercel/kv');

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

    const kv = createClient({
      url: process.env.KV_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    const tryInsert = async () => {
      code = generateUniqueCode();

      // Check if code already exists
      const existing = await kv.get(`user:${code}`);
      if (existing) {
        if (attempts < maxAttempts) {
          attempts++;
          return tryInsert();
        } else {
          throw new Error('Could not generate unique code');
        }
      }

      // Store user data
      await kv.set(`user:${code}`, JSON.stringify({
        gender,
        answers,
        created_at: new Date().toISOString()
      }));

      return code;
    };

    const finalCode = await tryInsert();

    res.json({ code: finalCode });

  } catch (error) {
    console.error('Error in submit-answers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}