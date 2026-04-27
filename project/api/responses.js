// Vercel serverless function for SUS survey responses
// Handles GET (fetch all), POST (submit), DELETE (clear all)

import { neon } from '@neondatabase/serverless';

function getSQL() {
  return neon(process.env.DATABASE_URL);
}

async function ensureTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS sus_responses (
      id SERIAL PRIMARY KEY,
      response_id TEXT UNIQUE NOT NULL,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      contact TEXT NOT NULL,
      residency_status TEXT NOT NULL,
      application_scheme TEXT NOT NULL,
      ea_usage TEXT NOT NULL,
      sus1 INTEGER NOT NULL CHECK (sus1 BETWEEN 1 AND 5),
      sus2 INTEGER NOT NULL CHECK (sus2 BETWEEN 1 AND 5),
      sus3 INTEGER NOT NULL CHECK (sus3 BETWEEN 1 AND 5),
      sus4 INTEGER NOT NULL CHECK (sus4 BETWEEN 1 AND 5),
      sus5 INTEGER NOT NULL CHECK (sus5 BETWEEN 1 AND 5),
      sus6 INTEGER NOT NULL CHECK (sus6 BETWEEN 1 AND 5),
      sus7 INTEGER NOT NULL CHECK (sus7 BETWEEN 1 AND 5),
      sus8 INTEGER NOT NULL CHECK (sus8 BETWEEN 1 AND 5),
      sus9 INTEGER NOT NULL CHECK (sus9 BETWEEN 1 AND 5),
      sus10 INTEGER NOT NULL CHECK (sus10 BETWEEN 1 AND 5),
      sus_score NUMERIC(4,1) NOT NULL,
      flagged BOOLEAN NOT NULL DEFAULT FALSE
    )
  `;
}

// Helper: calculate SUS score from responses object
function calculateSUS(sus) {
  let total = 0;
  for (let i = 1; i <= 10; i++) {
    const r = Number(sus[`sus${i}`]);
    total += i % 2 === 1 ? r - 1 : 5 - r;
  }
  return Math.round(total * 2.5 * 10) / 10;
}

// Helper: determine if response is flagged (EA did it for participant)
function isFlagged(ea_usage) {
  return ea_usage === 'Yes (EA did it for me)';
}

export default async function handler(req, res) {
  // Enable CORS for local dev and production
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const sql = getSQL();
    await ensureTable(sql);

    if (req.method === 'GET') {
      // Fetch all responses for dashboard
      const rows = await sql`
        SELECT 
          response_id as id,
          submitted_at,
          full_name,
          email,
          contact,
          residency_status,
          application_scheme,
          ea_usage,
          sus1, sus2, sus3, sus4, sus5, sus6, sus7, sus8, sus9, sus10,
          sus_score,
          flagged
        FROM sus_responses
        ORDER BY submitted_at DESC
      `;

      // Transform to match the format expected by dashboard
      const responses = rows.map(row => ({
        id: row.id,
        timestamp: row.submitted_at,
        contact_info: {
          full_name: row.full_name,
          email: row.email,
          contact: row.contact
        },
        screener: {
          residency_status: row.residency_status,
          application_scheme: row.application_scheme,
          ea_usage: row.ea_usage
        },
        sus_responses: {
          sus1: row.sus1,
          sus2: row.sus2,
          sus3: row.sus3,
          sus4: row.sus4,
          sus5: row.sus5,
          sus6: row.sus6,
          sus7: row.sus7,
          sus8: row.sus8,
          sus9: row.sus9,
          sus10: row.sus10
        },
        sus_score: parseFloat(row.sus_score),
        flagged: row.flagged
      }));

      return res.status(200).json(responses);
    }

    if (req.method === 'POST') {
      // Submit new response
      const data = req.body;

      if (!data || !data.contact_info || !data.screener || !data.sus_responses) {
        return res.status(400).json({ error: 'Invalid request body' });
      }

      const responseId = 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const susScore = calculateSUS(data.sus_responses);
      const flagged = isFlagged(data.screener.ea_usage);

      await sql`
        INSERT INTO sus_responses (
          response_id, submitted_at,
          full_name, email, contact,
          residency_status, application_scheme, ea_usage,
          sus1, sus2, sus3, sus4, sus5, sus6, sus7, sus8, sus9, sus10,
          sus_score, flagged
        ) VALUES (
          ${responseId}, NOW(),
          ${data.contact_info.full_name}, ${data.contact_info.email}, ${data.contact_info.contact},
          ${data.screener.residency_status}, ${data.screener.application_scheme}, ${data.screener.ea_usage},
          ${data.sus_responses.sus1}, ${data.sus_responses.sus2}, ${data.sus_responses.sus3},
          ${data.sus_responses.sus4}, ${data.sus_responses.sus5}, ${data.sus_responses.sus6},
          ${data.sus_responses.sus7}, ${data.sus_responses.sus8}, ${data.sus_responses.sus9}, ${data.sus_responses.sus10},
          ${susScore}, ${flagged}
        )
      `;

      return res.status(201).json({ ok: true, id: responseId });
    }

    if (req.method === 'DELETE') {
      // Clear all responses (researcher action)
      await sql`DELETE FROM sus_responses`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
