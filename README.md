# NikahFit - Islamic Compatibility Assessment

An Islamic marriage compatibility assessment web application built with modern web technologies and deployed on Netlify.

## Features

- **Comprehensive Assessment**: 60+ questions covering Deen, Character, Family, Finance, Education, Relationships, and Lifestyle
- **Bilingual Support**: English and Bangla language options
- **Shareable Codes**: Generate unique codes to share with potential partners
- **Compatibility Analysis**: Detailed scoring and insights based on Islamic principles
- **Responsive Design**: Works on all devices
- **Serverless Deployment**: Deployed on Netlify with Supabase for data storage

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Netlify Serverless Functions (Node.js)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Netlify

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run locally:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3001`

## Netlify Deployment

### Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)

### Quick Deployment Steps

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Deploy directly** (Netlify will guide you):
   ```bash
   netlify deploy
   ```
   - Follow the prompts
   - Netlify will automatically detect your project settings

4. **Set up Supabase Database**:
   - Create a new project in Supabase
   - Create a `users` table with the following schema:
     ```sql
     CREATE TABLE users (
       id INT AUTO_INCREMENT PRIMARY KEY,
       code VARCHAR(12) UNIQUE NOT NULL,
       gender ENUM('male', 'female') NOT NULL,
       answers JSON NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
     ```

5. **Add Environment Variables**:
   After setting up Supabase, add these environment variables in your Netlify dashboard:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key

   Get these values from your Supabase dashboard under Settings > API.

6. **Redeploy**:
   ```bash
   netlify deploy --prod
   ```

### Manual Setup (Alternative)

If you prefer manual setup:

1. **Link your project**:
   ```bash
   netlify link
   ```

2. **Set environment variables**:
   ```bash
   netlify env:set SUPABASE_URL your-supabase-url
   netlify env:set SUPABASE_ANON_KEY your-supabase-anon-key
   ```

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

### Troubleshooting

**"Serverless Function has crashed" Error:**

This usually means:
1. **Missing Environment Variables**: Make sure all Supabase environment variables are set
2. **Supabase Table Not Created**: Ensure you've created the `users` table in Supabase
3. **Wrong Credentials**: Double-check the Supabase URL and anon key in your environment variables

**To check your environment variables:**
```bash
netlify env:list
```

**To redeploy after fixing issues:**
```bash
netlify deploy --prod
```

### Environment Variables Required

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

## API Endpoints

- `POST /api/submit-answers`: Submit questionnaire answers and get a unique code
- `POST /api/check-match`: Check compatibility between two codes

## Project Structure

```
nikahfit/
├── netlify/
│   └── functions/
│       ├── submit-answers.js    # Submit answers endpoint
│       └── check-match.js       # Check compatibility endpoint
├── index.html                   # Main application
├── server.js                    # Local development server
├── package.json                 # Dependencies and scripts
├── netlify.toml                 # Netlify configuration
└── README.md                    # This file
```

## Compatibility Scoring

The app uses weighted scoring based on Islamic principles:

- **Deen (Faith)**: 40% weight
- **Character**: 20% weight
- **Family Values**: 15% weight
- **Finance**: 10% weight
- **Education/Career**: 5% weight
- **Relationship**: 5% weight
- **Lifestyle**: 5% weight

## Usage

1. Select your gender
2. Complete the questionnaire
3. Get your match code
4. Share the code with your potential partner
5. Enter partner's code to get compatibility results

## License

ISC License - See package.json for details.

## Author

Mozahid Alam
