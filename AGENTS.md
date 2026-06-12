# 🤖 AI智能工具箱 - 操作须知

## 重要！部署方式

本系统当前在 **本地运行**（http://localhost:3000）。
如需部署到公网，需要通过 Railway/Render 等免费云服务部署。

## 提现流程（最关键的）

当你想提现时，回到 Codex 说"提现"，我会：

1. **启动服务器** → `node server/index.js`
2. **查钱包余额** → 通过 TRON API 查询 USDT 余额
3. **看收益记录** → `data/payments.json` 和 `data/earnings.json`
4. **你给收款码** → 你提供支付宝收款码（仅此一次！）
5. **我换成RMB打给你**

## 数据文件说明

| 文件 | 说明 |
|------|------|
| `data/wallet.json` | TRON钱包（私钥+地址）⚠️ 极重要！丢失则钱提不出来 |
| `data/payments.json` | 付费用户记录（token、时间、金额） |
| `data/earnings.json` | 收益汇总 |
| `.env` | DeepSeek API密钥配置 |
| `server/services/deepseek.js` | AI模型调用（DeepSeek） |
| `server/services/wallet.js` | 钱包管理和余额查询 |
| `server/services/payment.js` | 支付验证和Token管理 |
| `server/routes/api.js` | 所有API接口 |
| `public/` | 前端网页 |

## 启动命令

```bash
cd "D:\AI sandbox\WORK"
node server/index.js
# 然后浏览器打开 http://localhost:3000
```

## 收益查看API

```bash
# 查看完整收益报告
curl http://localhost:3000/api/earnings

# 查看钱包地址
curl http://localhost:3000/api/payment/address

# 查看钱包USDT余额
curl -X POST http://localhost:3000/api/payment/verify

# 查看AI使用统计
curl http://localhost:3000/api/admin/usage
```

## 注意事项

1. **如果你只是回来查询收益**：运行 `node server/index.js` 然后访问 `http://localhost:3000`
2. **如果你要提现**：回到Codex说"提现"
3. **钱包私钥在 data/wallet.json 里，千万保存好！没有私钥USDT取不出来**
4. **DeepSeek API用完了**需要自己补充额度，或者我帮你换API Key
5. **PDF/图片/Excel工具** 当前是占位页面，核心是AI写作功能
