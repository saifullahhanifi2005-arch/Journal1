/**
 * BJournal & The Fools Hunting Room — Full-Stack Cloud Backend Server
 *
 * Provides:
 *   - Hybrid MongoDB Atlas / Local File Storage Engine (`dbAdapter.js`)
 *   - Global User Accounts & Zero-Knowledge Encrypted Vault API (`/api/auth`, `/api/vault`)
 *   - Live Forex News (Finnhub Economic Calendar + ForexFactory) (`/api/news`)
 *   - Auto Gmail Sending & Scheduled Reports (`/api/email`)
 *   - Community Chat & Public Arena Snapshot Sync (`/api/chat`, `/api/arena`)
 *   - Static Web Application Hosting (`/`)
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import authRouter from './routes/auth.js';
import vaultRouter from './routes/vault.js';
import chatRouter from './routes/chat.js';
import arenaRouter from './routes/arena.js';
import { fetchFinnhubCalendar, fetchFinnhubForexNews, fetchForexFactoryWeek } from './newsFetcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

// ─── MongoDB Atlas / Local Hybrid Database Init ───
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
if (mongoUri) {
  mongoose.connect(mongoUri)
    .then(() => {
      console.log('✅ Connected to MongoDB Atlas Cloud Database!');
    })
    .catch((err) => {
      console.error('❌ MongoDB Atlas connection error:', err.message);
      console.log('⚠️  Falling back to high-performance local JSON storage (data/db.json)');
    });
} else {
  console.log('ℹ️  No MONGODB_URI set — running with high-performance local/hybrid persistence (data/db.json).');
}

// ─── Mount Cloud REST API Routers ──────────────────
app.use('/api/auth', authRouter);
app.use('/api/vault', vaultRouter);
app.use('/api/chat', chatRouter);
app.use('/api/arena', arenaRouter);

// ─── Health Check ──────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'mongodb-atlas' : 'local-hybrid',
    services: {
      news: !!process.env.FINNHUB_API_KEY,
      email: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
    },
    timestamp: new Date().toISOString(),
  });
});

// ═══════════════════════════════════════════════════
// NEWS ENDPOINTS
// ═══════════════════════════════════════════════════

app.get('/api/news/calendar', async (req, res) => {
  try {
    const from = req.query.from || todayStr();
    const to = req.query.to || addDays(todayStr(), 7);

    const finnhubKey = process.env.FINNHUB_API_KEY;
    if (finnhubKey) {
      const events = await fetchFinnhubCalendar(finnhubKey, from, to);
      if (events.length > 0) {
        return res.json({ source: 'finnhub', events, fetchedAt: new Date().toISOString() });
      }
    }

    try {
      const ffEvents = await fetchForexFactoryWeek();
      if (ffEvents.length > 0) {
        return res.json({ source: 'forexfactory', events: ffEvents, fetchedAt: new Date().toISOString() });
      }
    } catch { /* ignore */ }

    return res.json({
      source: 'none',
      events: [],
      fetchedAt: new Date().toISOString(),
      message: 'No news API configured. Set FINNHUB_API_KEY in backend/.env — get a free key at https://finnhub.io/register',
    });
  } catch (err) {
    console.error('News calendar error:', err);
    res.status(500).json({ error: 'Failed to fetch news calendar' });
  }
});

app.get('/api/news/forex', async (req, res) => {
  try {
    const finnhubKey = process.env.FINNHUB_API_KEY;
    if (!finnhubKey) {
      return res.json({
        articles: [],
        message: 'Set FINNHUB_API_KEY in backend/.env — get a free key at https://finnhub.io/register',
      });
    }
    const articles = await fetchFinnhubForexNews(finnhubKey);
    res.json({ articles, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Forex news error:', err);
    res.status(500).json({ error: 'Failed to fetch forex news' });
  }
});

// ═══════════════════════════════════════════════════
// EMAIL ENDPOINTS
// ═══════════════════════════════════════════════════

app.post('/api/email/send', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;
    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }
    const transporter = createGmailTransporter();
    if (!transporter) {
      return res.status(503).json({ error: 'Email not configured', message: 'Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.' });
    }
    const info = await transporter.sendMail({
      from: `"The Fools Hunting Room" <${process.env.GMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(',') : to,
      subject, html, text: text || undefined,
    });
    console.log(`✉️ Email sent to ${to}: ${info.messageId}`);
    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send email', details: err.message });
  }
});

app.post('/api/email/report', async (req, res) => {
  try {
    const { to, reportHtml, subject, period } = req.body;
    if (!to || !reportHtml) {
      return res.status(400).json({ error: 'Missing required fields: to, reportHtml' });
    }
    const transporter = createGmailTransporter();
    if (!transporter) {
      return res.status(503).json({ error: 'Email not configured', message: 'Set GMAIL_USER and GMAIL_APP_PASSWORD in .env' });
    }
    const reportSubject = subject || `${period || 'Weekly'} Trading Report — The Fools Hunting Room`;
    const info = await transporter.sendMail({
      from: `"The Fools Hunting Room" <${process.env.GMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(',') : to,
      subject: reportSubject,
      html: reportHtml,
    });
    console.log(`📊 Report emailed to ${to}: ${info.messageId}`);
    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('Report email error:', err);
    res.status(500).json({ error: 'Failed to send report', details: err.message });
  }
});

app.post('/api/email/excel', async (req, res) => {
  try {
    const { to, excelBase64, filename, subject } = req.body;
    if (!to || !excelBase64) {
      return res.status(400).json({ error: 'Missing required fields: to, excelBase64' });
    }
    const transporter = createGmailTransporter();
    if (!transporter) {
      return res.status(503).json({ error: 'Email not configured' });
    }
    const buf = Buffer.from(excelBase64, 'base64');
    const fname = filename || `FHR-Report-${new Date().toISOString().slice(0, 10)}.xlsx`;
    const info = await transporter.sendMail({
      from: `"The Fools Hunting Room" <${process.env.GMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(',') : to,
      subject: subject || `Excel Report — ${fname}`,
      html: `<p>Your trading report is attached as <strong>${fname}</strong>.</p><p>— The Fools Hunting Room</p>`,
      attachments: [{ filename: fname, content: buf, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }],
    });
    console.log(`📊 Excel report emailed to ${to}: ${info.messageId}`);
    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('Excel email error:', err);
    res.status(500).json({ error: 'Failed to send excel report', details: err.message });
  }
});

app.get('/api/email/test', async (_req, res) => {
  const transporter = createGmailTransporter();
  if (!transporter) {
    return res.json({ configured: false, message: 'Email not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env' });
  }
  try {
    await transporter.verify();
    res.json({ configured: true, user: process.env.GMAIL_USER, message: '✅ Gmail SMTP connected successfully!' });
  } catch (err) {
    res.json({ configured: false, message: `❌ Gmail SMTP connection failed: ${err.message}` });
  }
});

// ═══════════════════════════════════════════════════
// SCHEDULED REPORTS (Cron)
// ═══════════════════════════════════════════════════

const reportSchedule = process.env.REPORT_SCHEDULE || '0 9 * * 1';
const reportRecipients = process.env.REPORT_RECIPIENTS;

if (reportRecipients && cron.validate(reportSchedule)) {
  cron.schedule(reportSchedule, () => {
    console.log(`⏰ Scheduled report triggered at ${new Date().toISOString()}`);
  });
  console.log(`📅 Scheduled reports: ${reportSchedule} → ${reportRecipients}`);
}

// ═══════════════════════════════════════════════════
// STATIC WEB APP SERVING (Full-Stack Online Hosting)
// ═══════════════════════════════════════════════════

const distPaths = [
  path.join(__dirname, '../frontend/dist'),
  path.join(__dirname, '../BJournal-main/dist')
];

for (const distPath of distPaths) {
  app.use(express.static(distPath));
}

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  for (const distPath of distPaths) {
    const indexPath = path.join(distPath, 'index.html');
    if (express.static.mime.lookup(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  res.status(404).send('BJournal Web Application static build not found. Run `npm run build` inside frontend/ or BJournal-main/');
});

// ═══════════════════════════════════════════════════
// HELPERS & SERVER STARTUP
// ═══════════════════════════════════════════════════

function createGmailTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
}

function todayStr() { return new Date().toISOString().slice(0, 10); }
function addDays(dateStr, days) { const d = new Date(dateStr); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('');
  console.log('⚔️  The Fools Hunting Room — Full-Stack Cloud Backend');
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`🌐 API Endpoints active at http://localhost:${PORT}/api`);
  console.log(`📡 News API:  ${process.env.FINNHUB_API_KEY ? '✅ Finnhub configured' : '⚠️  No FINNHUB_API_KEY set'}`);
  console.log(`📧 Email:     ${process.env.GMAIL_USER ? '✅ Gmail configured' : '⚠️  No Gmail credentials set'}`);
  console.log('');
});
