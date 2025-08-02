#!/bin/sh

# 设置错误时退出
set -e

# 输出环境信息
echo "🚀 启动岁阅回忆录平台..."
echo "📊 环境变量:"
echo "  - NODE_ENV: $NODE_ENV"
echo "  - PORT: $PORT"
echo "  - HOSTNAME: $HOSTNAME"
echo "  - NEXT_PUBLIC_CLOUDBASE_ENV_ID: $NEXT_PUBLIC_CLOUDBASE_ENV_ID"

# 检查必要文件
if [ ! -f "server.js" ]; then
    echo "❌ 错误: server.js 文件不存在"
    exit 1
fi

# 启动应用
echo "🎯 在端口 $PORT 启动应用..."
exec node server.js