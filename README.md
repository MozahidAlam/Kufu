# KufuMatch - Islamic Compatibility Assessment

A web application for evaluating marriage compatibility based on Islamic principles and modern socio-personal factors.

## Features

- Comprehensive questionnaire covering Deen, character, family values, finance, and more
- Weighted scoring algorithm prioritizing Islamic values
- Match code system for privacy
- Bilingual support (English/Bangla)
- Responsive design

## Setup

### Prerequisites

- Node.js (v14 or higher)

### Installation

1. Clone or download the project files.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and go to `http://localhost:3000`

## Usage

1. Select your gender
2. Complete the questionnaire
3. Get your match code
4. Share the code with your potential partner
5. Enter partner's code to get compatibility results

## API Endpoints

- `POST /api/submit-answers` - Submit questionnaire answers
- `POST /api/check-match` - Check compatibility between two codes

## Database Schema

```sql
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