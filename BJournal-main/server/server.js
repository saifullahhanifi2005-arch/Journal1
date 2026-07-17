/**
 * BJournal Backend Server
 *
 * Provides:
 *   - Live Forex News (Finnhub Economic Calendar + ForexFactory)
 *   - Auto Gmail Sending (Nodemailer)
 *   - Scheduled Report Emails (node-cron)
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { fetchFinnhubCalendar, fetchFinnhubForexNews, fetchForexFactoryWeek } from './newsFetcher.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

// ─── Health Check ──────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
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

    // Try Finnhub first
    const finnhubKey = process.env.FINNHUB_API_KEY;
    if (finnhubKey) {
      const events = await fetchFinnhubCalendar(finnhubKey, from, to);
      if (events.length > 0) {
        return res.json({ source: 'finnhub', events, fetchedAt: new Date().toISOString() });
      }
    }

    // Fallback: ForexFactory
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
      message: 'No news API configured. Set FINNHUB_API_KEY in server/.env — get a free key at https://finnhub.io/register',
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
        message: 'Set FINNHUB_API_KEY in server/.env — get a free key at https://finnhub.io/register',
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
      return res.status(503).json({ error: 'Email not configured', message: 'Set GMAIL_USER and GMAIL_APP_PASSWORD in server/.env.' });
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
      return res.status(503).json({ error: 'Email not configured', message: 'Set GMAIL_USER and GMAIL_APP_PASSWORD in server/.env' });
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
    return res.json({ configured: false, message: 'Email not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in server/.env' });
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
// HELPERS
// ═══════════════════════════════════════════════════

function createGmailTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
}

function todayStr() { return new Date().toISOString().slice(0, 10); }
function addDays(dateStr, days) { const d = new Date(dateStr); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }

// ─── Start Server ──────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('');
  console.log('⚔️  The Fools Hunting Room — Backend Server');
  console.log(`🚀 Running on http://localhost:${PORT}`);
  console.log('');
  console.log(`📡 News API:  ${process.env.FINNHUB_API_KEY ? '✅ Finnhub configured' : '⚠️  No FINNHUB_API_KEY set'}`);
  console.log(`📧 Email:     ${process.env.GMAIL_USER ? '✅ Gmail configured' : '⚠️  No Gmail credentials set'}`);
  console.log(`📅 Schedule:  ${reportSchedule} → ${reportRecipients || 'no recipients'}`);
  console.log('');
  console.log('📖 See server/.env.example for setup instructions');
  console.log('');
});
