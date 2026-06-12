# 🚀 部署指南 - 让网站24小时在线赚钱

## 方式一：一键部署到 Railway（推荐，最简）

1. 打开 https://railway.app/
2. 点击 "Start a new project" → "Deploy from GitHub repo"
3. 如果没有GitHub账号，先注册一个（免费）
4. Fork或推送这个项目到你的GitHub
5. 连接Railway后，设置环境变量：
   - `DEEPSEEK_API_KEY` = sk-58e0a0dfea604a30bafcf83718a0eed2
6. Railway会自动部署，生成公网URL

## 方式二：部署到 Render

1. 打开 https://render.com/
2. 注册账号（免费，不需要信用卡）
3. 点击 "New +" → "Web Service"
4. 连接你的GitHub仓库
5. 配置：
   - Name: `ai-toolbox`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node server/index.js`
6. 添加环境变量 `DEEPSEEK_API_KEY`
7. 部署完成

## 方式三：部署到 Zeabur（中国用户友好）

1. 打开 https://zeabur.com/
2. 注册账号
3. 从GitHub导入项目
4. 设置环境变量

## 本地运行（测试用）

```bash
cd "D:\AI sandbox\WORK"
node server/index.js
# 浏览器打开 http://localhost:3000
```

## 部署后需要做的事

1. ✅ 网站24小时在线
2. ✅ 用户可访问并付费使用
3. ✅ 收益自动记录到 data/payments.json
4. ⏳ 提现时回Codex找我

## 钱包私钥备份

**非常重要！** `data/wallet.json` 文件里的私钥是收USDT的唯一凭证。
先备份到安全位置后再部署！
