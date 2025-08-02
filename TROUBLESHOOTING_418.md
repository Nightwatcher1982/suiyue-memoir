# 🔧 418错误故障排查指南

## 🚨 问题描述
访问应用时出现：`Failed to load resource: the server responded with a status of 418`

## 🔍 418状态码含义
HTTP 418 "I'm a teapot" - 通常表示：
- 服务临时不可用
- CDN边缘节点问题
- 部署过程中的临时错误

## 🛠️ 解决步骤

### 1. 检查部署状态
访问CloudBase控制台：
```
https://console.cloud.tencent.com/tcb/env/overview?envId=suiyue-memoir-dev-3e9aoud20837ef
```

确认：
- [ ] 容器服务状态是否为"运行中"
- [ ] 最新部署是否成功
- [ ] 是否有错误日志

### 2. 清除缓存重试
- 清除浏览器缓存
- 尝试无痕模式访问
- 强制刷新 (Ctrl+F5 / Cmd+Shift+R)

### 3. 尝试不同端点
- 健康检查：`/health`
- 主页：`/`
- 调试页面：`/debug-cloudbase`

### 4. 等待缓存更新
CloudBase CDN更新可能需要：
- 2-5分钟：边缘节点同步
- 5-10分钟：全球CDN更新

### 5. 检查网络连接
```bash
# 测试DNS解析
nslookup suiyue-memoir-dev-3e9aoud20837ef.tcloudbaseapp.com

# 测试连接
curl -I https://suiyue-memoir-dev-3e9aoud20837ef.tcloudbaseapp.com/health
```

## 📱 临时访问方案

### 方案1：直接访问容器IP
如果CloudBase提供了直接访问IP，可以临时使用

### 方案2：使用本地开发环境
```bash
# 克隆代码到本地
git clone https://github.com/Nightwatcher1982/suiyue-memoir.git
cd suiyue-memoir

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 方案3：等待自动恢复
418错误通常是临时的，等待10-15分钟后重试

## 🔄 监控恢复状态

### 检查命令
```bash
# 检查HTTP状态
curl -s -o /dev/null -w "%{http_code}" https://suiyue-memoir-dev-3e9aoud20837ef.tcloudbaseapp.com/

# 检查健康状态  
curl https://suiyue-memoir-dev-3e9aoud20837ef.tcloudbaseapp.com/health
```

### 预期结果
- HTTP状态码：200
- 健康检查返回：`{"status":"healthy",...}`

## 📞 联系支持

如果问题持续超过30分钟：

1. **CloudBase工单系统**
   - 提交技术支持工单
   - 描述418错误和时间

2. **腾讯云客服**
   - 电话：95716
   - 在线客服支持

3. **社区支持**
   - CloudBase官方QQ群
   - 开发者社区论坛

## ✅ 恢复验证清单

服务恢复后，请验证：
- [ ] 主页正常加载
- [ ] 健康检查返回200
- [ ] 短信登录功能测试
- [ ] 调试页面可访问
- [ ] 用户注册流程正常

---

## 💡 预防措施

1. **设置监控告警**
   - CloudBase控制台配置告警
   - 监控服务可用性

2. **备用访问方案**
   - 配置自定义域名
   - 设置多地域部署

3. **健康检查优化**
   - 增加更详细的健康检查
   - 监控关键服务状态