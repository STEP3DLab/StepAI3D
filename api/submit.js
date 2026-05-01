const RATE_WINDOW_MS = 10 * 60 * 1000;
const fs = require('node:fs');
const path = require('node:path');
const RATE_LIMIT_PER_IP = 8;
const RATE_LIMIT_PER_UA = 20;
const MIN_FILL_MS = 4000;
const CONTACT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_TG = /^@?[a-zA-Z0-9_]{5,32}$/;

const memoryStore = {
  byIp: new Map(),
  byUa: new Map(),
};

function pruneBucket(bucket, now) {
  while (bucket.length && now - bucket[0] > RATE_WINDOW_MS) bucket.shift();
}

function normalizeText(value, maxLen = 500) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

function normalizeContact(raw) {
  const value = normalizeText(raw, 128).replace(/\s/g, '');
  const lower = value.toLowerCase();
  if (CONTACT_EMAIL.test(lower)) return { value: lower, type: 'email' };
  if (CONTACT_TG.test(value)) return { value: value.startsWith('@') ? value : `@${value}`, type: 'telegram' };
  return null;
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function logRejected(reason, meta) {
  const entry = { ts: new Date().toISOString(), reason, ...meta };
  console.warn('[REJECTED_FORM]', JSON.stringify(entry));
  try {
    fs.appendFileSync(path.join(process.cwd(), 'logs', 'rejected-submissions.log'), `${JSON.stringify(entry)}\n`, 'utf8');
  } catch (_) {}
}

function shouldRequireCaptcha(ipBucket, uaBucket) {
  return ipBucket.length > Math.floor(RATE_LIMIT_PER_IP * 0.7) || uaBucket.length > Math.floor(RATE_LIMIT_PER_UA * 0.7);
}

async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().split(',')[0].trim();
  const ua = normalizeText(req.headers['user-agent'] || 'unknown', 250);
  const now = Date.now();

  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 100_000) req.destroy();
  });

  req.on('end', () => {
    try {
      const data = JSON.parse(body || '{}');
      const ipBucket = memoryStore.byIp.get(ip) || [];
      const uaBucket = memoryStore.byUa.get(ua) || [];
      pruneBucket(ipBucket, now);
      pruneBucket(uaBucket, now);

      if (ipBucket.length >= RATE_LIMIT_PER_IP || uaBucket.length >= RATE_LIMIT_PER_UA) {
        logRejected('rate_limit', { ip, ua, ipHits: ipBucket.length, uaHits: uaBucket.length });
        return json(res, 429, { error: 'Too many requests' });
      }

      ipBucket.push(now); uaBucket.push(now);
      memoryStore.byIp.set(ip, ipBucket); memoryStore.byUa.set(ua, uaBucket);

      const startedAt = Number(data.formStartedAt || 0);
      if (!startedAt || now - startedAt < MIN_FILL_MS || normalizeText(data.honeypot, 100)) {
        logRejected('bot_signal', { ip, ua, startedAt });
        return json(res, 400, { error: 'Suspicious request' });
      }

      const name = normalizeText(data.name, 80);
      const projectIdea = normalizeText(data.projectIdea, 700);
      const comment = normalizeText(data.comment, 700);
      const freeReason = normalizeText(data.freeReason, 700);
      const contact = normalizeContact(data.contact);

      if (!name || name.length < 2 || !contact || !projectIdea) {
        logRejected('validation_failed', { ip, ua, hasContact: Boolean(contact) });
        return json(res, 422, { error: 'Validation failed' });
      }

      const anomalyScore = [
        /https?:\/\//i.test(projectIdea),
        /(bitcoin|casino|loan|viagra)/i.test(`${projectIdea} ${comment}`),
        projectIdea.length < 10,
      ].filter(Boolean).length;

      if (anomalyScore >= 2) {
        logRejected('anomaly', { ip, ua, anomalyScore });
        return json(res, 422, { error: 'Anomalous request' });
      }

      if (shouldRequireCaptcha(ipBucket, uaBucket) && !normalizeText(data.captchaToken, 300)) {
        logRejected('captcha_required', { ip, ua });
        return json(res, 403, { error: 'CAPTCHA required' });
      }

      return json(res, 200, {
        ok: true,
        submission: { name, contact: contact.value, contactType: contact.type, projectIdea, comment, freeReason },
      });
    } catch (error) {
      logRejected('server_error', { ip, ua, message: error?.message || 'unknown' });
      return json(res, 400, { error: 'Invalid payload' });
    }
  });
}

module.exports = handler;
module.exports.default = handler;
