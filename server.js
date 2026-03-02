const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const APP_ID = process.env.BAILIAN_APP_ID || '16fb52ba1c734803acd1b491467e7a39';
const API_KEY = process.env.DASHSCOPE_API_KEY || '';
const BAILIAN_ENDPOINT = process.env.BAILIAN_ENDPOINT || `https://dashscope.aliyuncs.com/api/v1/apps/${APP_ID}/completion`;
const PUBLIC_DIR = path.join(__dirname, 'public');

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.webmanifest')) return 'application/manifest+json; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  return 'text/plain; charset=utf-8';
}

function extractText(data) {
  if (!data || typeof data !== 'object') return '';
  const direct = [
    data?.output?.text,
    data?.output?.answer,
    data?.output?.content,
    data?.output?.result,
    data?.data?.text,
    data?.data?.answer
  ].find((v) => typeof v === 'string' && v.trim());
  return direct || JSON.stringify(data, null, 2);
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 20 * 1024 * 1024) {
        reject(new Error('请求体过大'));
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function handleSolve(req, res) {
  const raw = await readBody(req);
  let body;
  try {
    body = JSON.parse(raw || '{}');
  } catch {
    return sendJson(res, 400, { error: '请求体必须是 JSON。' });
  }

  const question = String(body.question || '').trim();
  const imageDataUrl = String(body.imageDataUrl || '').trim();
  const requestApiKey = String(body.apiKey || '').trim();
  const finalApiKey = requestApiKey || API_KEY;

  if (!finalApiKey) {
    return sendJson(res, 400, { error: '请先在 APP 里输入阿里云百炼 API Key，或在服务端配置 DASHSCOPE_API_KEY。' });
  }

  if (!question && !imageDataUrl) {
    return sendJson(res, 400, { error: '请至少输入题目文字或上传图片。' });
  }

  const payload = {
    input: {
      prompt: question,
      question,
      image_list: imageDataUrl ? [imageDataUrl] : [],
      images: imageDataUrl ? [imageDataUrl] : []
    },
    parameters: {
      incremental_output: false
    }
  };

  const upstream = await fetch(BAILIAN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${finalApiKey}`,
      'Content-Type': 'application/json',
      'X-DashScope-SSE': 'disable'
    },
    body: JSON.stringify(payload)
  });

  const text = await upstream.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!upstream.ok) {
    return sendJson(res, upstream.status, { error: '百炼工作流调用失败', details: json });
  }

  return sendJson(res, 200, { answer: extractText(json), raw: json });
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not Found');
    }
    res.writeHead(200, { 'Content-Type': contentType(filePath) });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      });
      return res.end();
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, 200, { ok: true, appId: APP_ID });
    }

    if (req.method === 'POST' && url.pathname === '/api/solve') {
      return await handleSolve(req, res);
    }

    if (req.method === 'GET') {
      const file = url.pathname === '/' ? '/index.html' : url.pathname;
      const safePath = path.normalize(file).replace(/^\.+/, '');
      return serveFile(res, path.join(PUBLIC_DIR, safePath));
    }

    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
  } catch (error) {
    sendJson(res, 500, { error: '服务异常', details: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
