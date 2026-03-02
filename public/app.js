const form = document.getElementById('solveForm');
const statusBox = document.getElementById('status');
const resultSection = document.getElementById('resultSection');
const rendered = document.getElementById('rendered');
const submitBtn = document.getElementById('submitBtn');
const openPrintBtn = document.getElementById('openPrintBtn');
const imageInput = document.getElementById('imageInput');
const apiKeyInput = document.getElementById('apiKey');
const rememberKeyCheckbox = document.getElementById('rememberKey');

let latestAnswer = '';
const API_KEY_STORAGE = 'bailian_api_key';

function setStatus(text, isError = false) {
  statusBox.textContent = text;
  statusBox.style.color = isError ? '#b91c1c' : '#0f766e';
}

function loadSavedApiKey() {
  const saved = localStorage.getItem(API_KEY_STORAGE);
  if (saved) {
    apiKeyInput.value = saved;
    rememberKeyCheckbox.checked = true;
  }
}

function persistApiKey() {
  const apiKey = apiKeyInput.value.trim();
  if (rememberKeyCheckbox.checked && apiKey) {
    localStorage.setItem(API_KEY_STORAGE, apiKey);
  } else {
    localStorage.removeItem(API_KEY_STORAGE);
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

function buildMathJaxPrintableHtml(content) {
  const escaped = content.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>打印版-智能解题结果</title><script>window.MathJax={tex:{inlineMath:[['$','$'],['\\\\(','\\\\)']],displayMath:[['$$','$$'],['\\\\[','\\\\]']]},svg:{fontCache:'global'}};</script><script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script><style>body{font-family:'Times New Roman',serif;margin:24px;line-height:1.8}h1{margin-top:0}pre{white-space:pre-wrap;font-family:inherit}@media print{button{display:none}}</style></head><body><h1>智能解题结果（MathJax）</h1><button onclick="window.print()">打印</button><pre>${escaped}</pre></body></html>`;
}

rememberKeyCheckbox.addEventListener('change', persistApiKey);
apiKeyInput.addEventListener('blur', persistApiKey);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submitBtn.disabled = true;
  setStatus('正在提交到百炼工作流，请稍候...');

  try {
    const question = document.getElementById('question').value.trim();
    const apiKey = apiKeyInput.value.trim();
    const file = imageInput.files[0];
    const imageDataUrl = file ? await fileToDataUrl(file) : '';

    persistApiKey();

    const response = await fetch('/api/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, imageDataUrl, apiKey })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '调用失败');

    latestAnswer = data.answer || '未收到文本结果';
    rendered.textContent = latestAnswer;
    resultSection.classList.remove('hidden');
    setStatus('调用成功，已生成结果。');
  } catch (error) {
    setStatus(`调用失败：${error.message}`, true);
  } finally {
    submitBtn.disabled = false;
  }
});

openPrintBtn.addEventListener('click', () => {
  if (!latestAnswer) return;
  const html = buildMathJaxPrintableHtml(latestAnswer);
  const win = window.open('', '_blank');
  if (!win) return setStatus('浏览器拦截了弹窗，请允许后重试。', true);
  win.document.open();
  win.document.write(html);
  win.document.close();
});

loadSavedApiKey();
