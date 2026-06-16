const fs = require('fs');
const path = require('path');

const CONFIG_FILE = 'site-config.json';
const LOCAL_CONFIG_PATH = path.join(process.cwd(), CONFIG_FILE);

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024 * 3) {
        reject(new Error('Arquivo grande demais.'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 11 ? `55${digits}` : digits;
}

function sanitizeConfig(config) {
  const output = config && typeof config === 'object' ? config : {};
  output.branding = output.branding || {};
  output.contact = output.contact || {};
  output.sales = output.sales || {};
  output.tracking = output.tracking || {};
  output.store = output.store || {};
  output.announcement = output.announcement || {};

  output.contact.whatsappPhone = normalizePhone(output.contact.whatsappPhone || '551635130795');
  output.sales.quantityDefault = Number(output.sales.quantityDefault || 1);
  output.sales.showFloatingWhatsapp = output.sales.showFloatingWhatsapp !== false;
  output.announcement.enabled = output.announcement.enabled === true;

  return output;
}

function githubSettings() {
  const repoFromVercel = process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
    ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
    : '';

  return {
    token: process.env.GITHUB_TOKEN || process.env.ADMIN_GITHUB_TOKEN || '',
    repo: process.env.GITHUB_REPO || repoFromVercel,
    branch: process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || 'main'
  };
}

async function githubRequest(settings, url, options = {}) {
  const response = await fetch(`https://api.github.com${url}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${settings.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'bethy-admin-panel',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data.message || 'Falha ao comunicar com GitHub.');
  }
  return data;
}

async function readConfig() {
  const settings = githubSettings();
  if (settings.token && settings.repo) {
    const data = await githubRequest(
      settings,
      `/repos/${settings.repo}/contents/${CONFIG_FILE}?ref=${encodeURIComponent(settings.branch)}`
    );
    return JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
  }

  return JSON.parse(fs.readFileSync(LOCAL_CONFIG_PATH, 'utf8'));
}

async function writeConfig(config) {
  const settings = githubSettings();
  const content = Buffer.from(JSON.stringify(config, null, 2) + '\n', 'utf8').toString('base64');

  if (settings.token && settings.repo) {
    const current = await githubRequest(
      settings,
      `/repos/${settings.repo}/contents/${CONFIG_FILE}?ref=${encodeURIComponent(settings.branch)}`
    );

    return githubRequest(settings, `/repos/${settings.repo}/contents/${CONFIG_FILE}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: 'Atualiza configurações pelo painel admin',
        content,
        sha: current.sha,
        branch: settings.branch
      })
    });
  }

  if (process.env.VERCEL) {
    throw new Error('Configure ADMIN_TOKEN, GITHUB_TOKEN, GITHUB_REPO e GITHUB_BRANCH no Vercel para salvar online.');
  }

  fs.writeFileSync(LOCAL_CONFIG_PATH, Buffer.from(content, 'base64').toString('utf8'));
  return { local: true };
}

function isAuthorized(req) {
  const configuredToken = process.env.ADMIN_TOKEN;
  if (!configuredToken && !process.env.VERCEL) {
    return true;
  }

  const auth = req.headers.authorization || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const headerToken = req.headers['x-admin-token'] || '';
  return Boolean(configuredToken && (bearer === configuredToken || headerToken === configuredToken));
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Admin-Token');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    if (req.method === 'GET') {
      sendJson(res, 200, await readConfig());
      return;
    }

    if (req.method !== 'PUT') {
      sendJson(res, 405, { success: false, message: 'Use GET ou PUT.' });
      return;
    }

    if (!isAuthorized(req)) {
      sendJson(res, 401, { success: false, message: 'Token de admin inválido.' });
      return;
    }

    const body = await readBody(req);
    const config = sanitizeConfig(JSON.parse(body || '{}'));
    await writeConfig(config);
    sendJson(res, 200, { success: true, config });
  } catch (error) {
    sendJson(res, 500, { success: false, message: error.message || 'Erro interno.' });
  }
};
