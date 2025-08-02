#!/bin/bash

# 自动化部署脚本
echo "🚀 开始自动部署到CloudBase..."

# 使用expect来处理交互式输入
expect << 'EOF'
spawn tcb framework deploy --verbose
expect "是否需要修改默认配置" { send "N\r" }
expect "是否需要修改默认配置" { send "N\r" }
expect eof
EOF

echo "✅ 部署完成！"