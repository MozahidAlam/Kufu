# NikahFit - Islamic Compatibility Assessment

An Islamic marriage compatibility assessment web application built with modern web technologies and deployed on Vercel.

## Features

- **Comprehensive Assessment**: 60+ questions covering Deen, Character, Family, Finance, Education, Relationships, and Lifestyle
- **Bilingual Support**: English and Bangla language options
- **Shareable Codes**: Generate unique codes to share with potential partners
- **Compatibility Analysis**: Detailed scoring and insights based on Islamic principles
- **Responsive Design**: Works on all devices
- **Serverless Deployment**: Deployed on Vercel with Vercel KV for data storage

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Vercel KV (Redis-compatible key-value store)
- **Deployment**: Vercel

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
4. Open `http://localhost:3000`

## Vercel Deployment

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel KV Database**: Set up Vercel KV for data storage

### Quick Deployment Steps

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy directly** (Vercel will guide you):
   ```bash
   vercel
   ```
   - Follow the prompts
   - Vercel will automatically detect your project settings

4. **Set up Vercel KV Database**:
   ```bash
   vercel kv create
   ```
   - Choose a name for your database
   - Select your Vercel project

5. **Add Environment Variables**:
   After KV is created, add these environment variables in your Vercel dashboard:
   - `KV_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

   Get these values from your Vercel KV dashboard under the "Settings" tab.

6. **Redeploy**:
   ```bash
   vercel --prod
   ```

### Manual Setup (Alternative)

If you prefer manual setup:

1. **Link your project**:
   ```bash
   vercel link
   ```

2. **Create KV database**:
   ```bash
   vercel kv create
   ```

3. **Set environment variables**:
   ```bash
   vercel env add KV_URL
   vercel env add KV_REST_API_TOKEN
   vercel env add KV_REST_API_READ_ONLY_TOKEN
   ```

4. **Deploy**:
   ```bash
   vercel --prod
   ```

### Troubleshooting

**"Serverless Function has crashed" Error:**

This usually means:
1. **Missing Environment Variables**: Make sure all KV environment variables are set
2. **KV Database Not Created**: Ensure you've created a Vercel KV database
3. **Wrong Tokens**: Double-check the KV tokens in your environment variables

**To check your environment variables:**
```bash
vercel env ls
```

**To check your KV database:**
```bash
vercel kv ls
```

**To redeploy after fixing issues:**
```bash
vercel --prod
```

### Environment Variables Required

- `KV_URL`: Your Vercel KV database URL
- `KV_REST_API_TOKEN`: Your KV REST API token (read/write)
- `KV_REST_API_READ_ONLY_TOKEN`: Your KV read-only token

## API Endpoints

- `POST /api/submit-answers`: Submit questionnaire answers and get a unique code
- `POST /api/check-match`: Check compatibility between two codes

## Project Structure

```
nikahfit/
├── api/
│   ├── submit-answers.js    # Submit answers endpoint
│   └── check-match.js       # Check compatibility endpoint
├── index.html               # Main application
├── package.json             # Dependencies and scripts
├── vercel.json              # Vercel configuration
└── README.md               # This file
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
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(12) UNIQUE NOT NULL,
  gender ENUM('male', 'female') NOT NULL,
  answers JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: SQLite

## License

ISC