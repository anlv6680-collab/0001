# 手机端拍照解题 APP（阿里云百炼工作流 + MathJax 打印）

这是一个可在中国大陆网络环境部署使用的轻量 Node.js WebApp（可作为手机浏览器应用使用）：
- 支持手机拍照/相册选图。
- 支持输入题目文字。
- 将内容提交到阿里云百炼应用：`初中全科智慧提分系统-全流程`（App ID: `16fb52ba1c734803acd1b491467e7a39`）。
- 接收智能体结果后，生成带 MathJax 渲染能力的可打印 HTML 页面。
- 支持 PWA 安装（添加到主屏幕）和安装二维码展示。
- 支持在安卓手机 APP 页面直接输入百炼 API Key（可选择仅本机记住）。

## 1. 安装与启动

```bash
cp .env.example .env
# 编辑 .env 填入 DASHSCOPE_API_KEY
npm start
```

打开：`http://localhost:3000`

## 2. 环境变量

- `DASHSCOPE_API_KEY`：阿里云百炼 API Key（可选；若不配置，可在 APP 页面输入）
- `BAILIAN_APP_ID`：默认已填目标应用 ID
- `BAILIAN_ENDPOINT`：可选，默认使用 `https://dashscope.aliyuncs.com/api/v1/apps/${BAILIAN_APP_ID}/completion`
- `PORT`：服务端口

## 3. 手机上“安装 APP”

1. 先把服务部署到公网 HTTPS 域名（建议阿里云中国大陆节点）。
2. 手机浏览器打开页面，点击“安装应用”，或浏览器菜单“添加到主屏幕”。
3. 页面里点击“显示安装二维码”，可让另一台手机扫码直接打开安装页。

> 说明：这是 PWA 安装方式，不需要上架应用商店，也不用打包 APK。

## 4. 结果打印

当结果返回后，点击“打开可打印 MathJax 页面”，新页面内点击“打印”即可导出或打印。

## 5. 接口说明

前端提交 `application/json` 到 `/api/solve`：
- `question`：题目文本
- `imageDataUrl`：base64 Data URL 图片（可选）
- `apiKey`：阿里云百炼 API Key（可选，优先级高于服务端环境变量）

前端在浏览器内把图片转换为 base64 Data URL，服务端再放入 `input.image_list` / `input.images` 转发至百炼应用。

> 说明：不同百炼工作流编排对字段名可能有差异。如果你的编排节点使用了特定参数名，可在 `server.js` 的 `payload.input` 处按需调整。
