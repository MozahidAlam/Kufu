// Netlify serverless function for submitting answers
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
    const { gender, answers } = JSON.parse(event.body);

    if (!gender || !answers) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Gender and answers are required' })
      };
    }

    // Validate age and height if provided
    if (answers.age) {
      const age = parseInt(answers.age);
      if (isNaN(age) || age < 18 || age > 100) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Age must be between 18 and 100' })
        };
      }
    }
    if (answers.height) {
      const height = parseInt(answers.height);
      if (isNaN(height) || height < 100 || height > 250) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Height must be between 100 and 250 cm' })
        };
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

    const tryInsert = async () => {
      code = generateUniqueCode();

      // Check if code already exists in Supabase
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('code')
        .eq('code', code)
        .single();

      if (existingUser) {
        if (attempts < maxAttempts) {
          attempts++;
          return tryInsert();
        } else {
          throw new Error('Could not generate unique code');
        }
      }

      // Store user data in Supabase
      const { data, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            code,
            gender,
            answers,
            created_at: new Date().toISOString()
          }
        ]);

      if (insertError) {
        throw insertError;
      }

      return code;
    };

    const finalCode = await tryInsert();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ code: finalCode })
    };

  } catch (error) {
    console.error('Error in submit-answers:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
