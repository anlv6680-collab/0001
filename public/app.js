const form = document.getElementById('solveForm');
const statusBox = document.getElementById('status');
const resultSection = document.getElementById('resultSection');
const rendered = document.getElementById('rendered');
const submitBtn = document.getElementById('submitBtn');
const openPrintBtn = document.getElementById('openPrintBtn');
const imageInput = document.getElementById('imageInput');
const installBtn = document.getElementById('installBtn');
const showQrBtn = document.getElementById('showQrBtn');
const qrSection = document.getElementById('qrSection');
const qrImage = document.getElementById('qrImage');
const installUrlText = document.getElementById('installUrl');

let latestAnswer = '';
let deferredInstallPrompt = null;

function setStatus(text, isError = false) {
  statusBox.textContent = text;
  statusBox.style.color = isError ? '#b91c1c' : '#0f766e';
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

function buildQr() {
  const url = window.location.href;
  const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(url)}`;
  qrImage.src = qrApi;
  installUrlText.textContent = url;
  qrSection.classList.remove('hidden');
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installBtn.disabled = false;
});

installBtn.addEventListener('click', async () => {
  if (!deferredInstallPrompt) {
    setStatus('当前浏览器未触发安装提示，请使用“添加到主屏幕”。', true);
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBtn.disabled = true;
});

showQrBtn.addEventListener('click', buildQr);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    setStatus('离线能力注册失败，但不影响正常使用。', true);
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submitBtn.disabled = true;
  setStatus('正在提交到百炼工作流，请稍候...');

  try {
    const question = document.getElementById('question').value.trim();
    const file = imageInput.files[0];
    const imageDataUrl = file ? await fileToDataUrl(file) : '';

    const response = await fetch('/api/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, imageDataUrl })
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
