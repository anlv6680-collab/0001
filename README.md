# 手机端拍照解题 APP（阿里云百炼工作流 + MathJax 打印）

这是一个可在中国大陆网络环境部署使用的轻量 Node.js WebApp（可作为手机浏览器应用使用）：
- 支持手机拍照/相册选图。
- 支持输入题目文字。
- 将内容提交到阿里云百炼应用：`初中全科智慧提分系统-全流程`（App ID: `16fb52ba1c734803acd1b491467e7a39`）。
- 接收智能体结果后，生成带 MathJax 渲染能力的可打印 HTML 页面。
- 支持在安卓手机页面直接输入百炼 API Key（可选择仅本机记住）。

## 1. 本地启动

```bash
cp .env.example .env
# 可不填 DASHSCOPE_API_KEY，改为在手机页面输入
node server.js
```

打开：`http://localhost:3000`

## 2. 部署（中国大陆服务器）

### 方式 A：直接 Node 运行
```bash
# 服务器上
git clone <your-repo>
cd <your-repo>
cp .env.example .env
# 按需填写 DASHSCOPE_API_KEY
nohup node server.js > app.log 2>&1 &
```

### 方式 B：Docker 部署
```bash
docker build -t bailian-mobile .
docker run -d --name bailian-mobile -p 3000:3000 --env-file .env bailian-mobile
```

建议给域名配置 HTTPS（Nginx/Caddy 反代均可），安卓 WebView 与拍照上传体验更稳定。

## 3. 打包安卓 APK（GitHub Actions 自动构建）

仓库内已提供工作流：`.github/workflows/build-android-apk.yml`。

步骤：
1. 把代码推送到 GitHub 仓库。
2. 在 GitHub → Actions → `Build Android APK` → `Run workflow`。
3. 输入你部署后的 HTTPS 地址（例如 `https://your-domain.com`），会写入 Android WebView 加载地址。
4. 等待完成后，在该次 workflow 的 Artifacts 下载 `bailian-mobile-debug-apk`。
5. 解压得到 `app-debug.apk`，发送到安卓手机安装。

> 说明：`android/` 是 WebView 壳应用，安装后会直接打开你部署的网页服务。

## 4. 环境变量

- `DASHSCOPE_API_KEY`：阿里云百炼 API Key（可选；若不配置，可在 APP 页面输入）
- `BAILIAN_APP_ID`：默认已填目标应用 ID
- `BAILIAN_ENDPOINT`：可选，默认使用 `https://dashscope.aliyuncs.com/api/v1/apps/${BAILIAN_APP_ID}/completion`
- `PORT`：服务端口

## 5. 结果打印

当结果返回后，点击“打开可打印 MathJax 页面”，新页面内点击“打印”即可导出或打印。

## 6. 接口说明

前端提交 `application/json` 到 `/api/solve`：
- `question`：题目文本
- `imageDataUrl`：base64 Data URL 图片（可选）
- `apiKey`：阿里云百炼 API Key（可选，优先级高于服务端环境变量）

前端在浏览器内把图片转换为 base64 Data URL，服务端再放入 `input.image_list` / `input.images` 转发至百炼应用。

> 说明：不同百炼工作流编排对字段名可能有差异。如果你的编排节点使用了特定参数名，可在 `server.js` 的 `payload.input` 处按需调整。
