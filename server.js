import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureDatabase } from './src/db.js';
import authRoutes from './src/routes/authRoutes.js';
import logRoutes from './src/routes/logRoutes.js';
import summaryRoutes from './src/routes/summaryRoutes.js';
import { authOptional } from './src/middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(authOptional);

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Placeholder API root
app.get('/api', (req, res) => {
  res.json({ name: 'Reading Stars API', version: '0.1.0' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/summary', summaryRoutes);

// Initialize DB and start server
await ensureDatabase();

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

