const express = require('express');
const mariadb = require('mariadb');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5
});

pool.getConnection()
    .then(conn => {
        console.log("MariaDB Connected successfully");
        conn.release();
    })
    .catch(err => {
        console.error("Database initialization failed:", err.message);
    });

const ai = new GoogleGenAI({ apiKey: String(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY).trim() });

function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing fields" });

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, password]);
        res.status(201).json({ message: "Registration successful" });
    } catch (err) {
        res.status(400).json({ error: "Username already taken or database error" });
    } finally {
        if (conn) conn.release();
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT id, username, password FROM users WHERE username = ?", [username]);
        if (rows.length === 0 || rows[0].password !== password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        res.json({ message: "Login successful", userId: Number(rows[0].id), username: rows[0].username });
    } catch (err) {
        res.status(500).json({ error: "Login process failed" });
    } finally {
        if (conn) conn.release();
    }
});

app.post('/api/transcripts', async (req, res) => {
    const { title, rawText, userId } = req.body;

    if (!title || !rawText || !userId) {
        return res.status(400).json({ error: "Title, rawText, and userId are required" });
    }

    try {
        const prompt = `
            Analyze the following meeting transcript. Provide the response strictly as a valid JSON object with the following structural layout. Do not include markdown code blocks or any trailing text:
            {
              "summary": "A concise paragraph summarizing the meeting",
              "action_items": ["item 1", "item 2"],
              "tags": ["tag1", "tag2"]
            }
            
            Transcript:
            ${rawText}
        `;

        let textResponse;
        try {
            textResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
        } catch (aiTextError) {
            return res.status(500).json({ error: "Gemini Text Generation Failed", details: aiTextError.message });
        }

        let aiData;
        try {
            let cleanText = textResponse.text;
            if (cleanText.includes("```")) {
                cleanText = cleanText.replace(/```json|```/g, "").trim();
            }
            aiData = JSON.parse(cleanText);
        } catch (parseError) {
            return res.status(500).json({ error: "Failed to parse JSON response from Gemini", details: parseError.message, rawOutput: textResponse.text });
        }

        let embeddingResponse;
        try {
            const textToEmbed = `title: ${title} | summary: ${aiData.summary}`;
            embeddingResponse = await ai.models.embedContent({
                model: 'gemini-embedding-2',
                contents: textToEmbed
            });
        } catch (aiEmbedError) {
            return res.status(500).json({ error: "Gemini Embedding Generation Failed", details: aiEmbedError.message });
        }

        const vectorArray = embeddingResponse.embeddings[0].values;
        const stringifiedEmbedding = JSON.stringify(vectorArray);

        let conn;
        try {
            conn = await pool.getConnection();
            const query = `
                INSERT INTO transcripts (title, raw_text, summary, action_items, tags, embedding, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const result = await conn.query(query, [
                title,
                rawText,
                aiData.summary,
                JSON.stringify(aiData.action_items),
                JSON.stringify(aiData.tags),
                stringifiedEmbedding,
                userId
            ]);

            res.status(201).json({
                message: "Transcript processed and saved",
                id: Number(result.insertId),
                summary: aiData.summary,
                actionItems: aiData.action_items,
                tags: aiData.tags
            });
        } catch (dbError) {
            return res.status(500).json({ error: "MariaDB Insertion Failed", details: dbError.message });
        } finally {
            if (conn) conn.release();
        }

    } catch (error) {
        res.status(500).json({ error: "Unexpected processing failure", details: error.message });
    }
});

app.get('/api/transcripts/search', async (req, res) => {
    const { q, userId } = req.query;

    if (!q || !userId) {
        return res.status(400).json({ error: "Search query and userId are required" });
    }

    try {
        const embeddingResponse = await ai.models.embedContent({
            model: 'gemini-embedding-2',
            contents: q
        });
        const queryVector = embeddingResponse.embeddings[0].values;

        let conn;
        try {
            conn = await pool.getConnection();
            const rows = await conn.query("SELECT id, title, summary, action_items, tags, embedding FROM transcripts WHERE user_id = ?", [userId]);

            const results = rows.map(row => {
                let dbVector = [];
                try {
                    if (row.embedding) {
                        dbVector = typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding;
                    }
                } catch (e) {
                    console.error("Failed to parse vector for row:", row.id);
                }

                let rawScore = 0;
                if (Array.isArray(dbVector) && dbVector.length > 0) {
                    rawScore = cosineSimilarity(queryVector, dbVector);
                }

                const threshold = 0.45;
                let adjustedScore = 0.0;

                if (rawScore > threshold) {
                    adjustedScore = (rawScore - threshold) / (1.0 - threshold);
                }

                return {
                    id: Number(row.id),
                    title: row.title,
                    summary: row.summary,
                    actionItems: typeof row.action_items === 'string' ? JSON.parse(row.action_items) : row.action_items,
                    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
                    similarityScore: adjustedScore
                };
            });

            results.sort((a, b) => b.similarityScore - a.similarityScore);
            res.json(results.slice(0, 5));

        } finally {
            if (conn) conn.release();
        }

    } catch (error) {
        res.status(500).json({ error: "Semantic search execution failed", details: error.message });
    }
});

app.put('/api/transcripts/:id', async (req, res) => {
    const { id } = req.params;
    const { title, userId } = req.body;

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("UPDATE transcripts SET title = ? WHERE id = ? AND user_id = ?", [title, id, userId]);
        res.json({ message: "Transcript title updated successfully" });
    } catch (dbError) {
        res.status(500).json({ error: "Database update failed", details: dbError.message });
    } finally {
        if (conn) conn.release();
    }
});

app.delete('/api/transcripts/:id', async (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("DELETE FROM transcripts WHERE id = ? AND user_id = ?", [id, userId]);
        res.json({ message: "Transcript deleted successfully" });
    } catch (dbError) {
        res.status(500).json({ error: "Database deletion failed", details: dbError.message });
    } finally {
        if (conn) conn.release();
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));