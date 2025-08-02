# 🔧 容器部署问题修复指南

## 🚨 问题描述

部署时遇到的问题：

### 第一次部署问题
```
Liveness probe failed: dial tcp 10.12.5.77:80: connect: connection refused
Readiness probe failed: dial tcp 10.12.5.77:80: connect: connection refused
```

### 第二次部署问题
```
Error: listen EACCES: permission denied 0.0.0.0:80
Back-off restarting failed container
```

## 🔍 问题原因

1. **端口不匹配**: 容器在端口3000运行，CloudBase期望端口80
2. **权限问题**: 端口80需要root权限，但容器运行在非特权用户下
3. **缺少健康检查路由**: 容器没有健康检查端点
4. **配置错误**: CloudBase配置使用了错误的插件类型
5. **环境变量缺失**: CloudBase环境ID未正确传递

## ✅ 修复方案

### 1. 修复端口权限问题
```dockerfile
# 第一次修改（有权限问题）
EXPOSE 80
ENV PORT 80

# 最终修复 - 使用非特权端口
EXPOSE 8080
ENV PORT 8080
```

### 2. 添加健康检查路由
创建 `src/app/health/route.ts`:
```typescript
export async function GET() {
  return Response.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'suiyue-memoir'
  });
}
```

### 3. 更新CloudBase配置
使用容器插件并配置正确端口:
```json
{
  "framework": {
    "name": "@cloudbase/framework-plugin-container",
    "use": "@cloudbase/framework-plugin-container",
    "inputs": {
      "serviceName": "suiyue-memoir",
      "servicePath": "/",
      "dockerfilePath": "./Dockerfile",
      "containerPort": 8080
    }
  }
}
```

### 4. 添加容器健康检查
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:80/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"
```

### 5. 改进启动脚本
创建 `start.sh` 提供更好的日志和错误处理。

## 🚀 重新部署步骤

### 1. 提交修复
```bash
git add .
git commit -m "fix: 修复容器部署端口和健康检查问题"
git push origin main
```

### 2. CloudBase重新部署
1. 访问CloudBase控制台
2. 进入「构建部署」
3. 选择「从代码仓库部署」
4. 重新触发部署

### 3. 验证部署
部署成功后访问：
- 主页: `https://your-app.tcloudbaseapp.com/`
- 健康检查: `https://your-app.tcloudbaseapp.com/health`

## 🔍 故障排查

### 1. 检查容器日志
在CloudBase控制台查看容器运行日志，确认：
- 应用是否在端口80启动
- 是否有错误信息
- 健康检查是否通过

### 2. 验证健康检查
```bash
# 本地测试
curl http://localhost:80/health

# 应该返回
{
  "status": "healthy",
  "timestamp": "2025-08-02T08:38:49.000Z",
  "service": "suiyue-memoir"
}
```

### 3. 常见问题
- **端口占用**: 确保没有其他服务占用端口80
- **权限问题**: 确保nextjs用户有执行权限
- **环境变量**: 确认CloudBase环境变量正确设置

## 📊 监控建议

1. **设置告警**: CloudBase控制台设置部署失败告警
2. **日志监控**: 定期检查容器运行日志
3. **健康检查**: 监控 `/health` 端点响应时间

## 🎯 预期结果

修复后应该看到：
- ✅ 容器成功启动在端口80
- ✅ 健康检查通过
- ✅ 应用可以正常访问
- ✅ 所有功能正常工作

---

**部署成功后，你的岁阅回忆录平台将稳定运行在CloudBase容器服务上！**