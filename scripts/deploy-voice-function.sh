#!/bin/bash

# CloudBase语音识别云函数部署脚本
# 使用方法: ./scripts/deploy-voice-function.sh [环境ID]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：输出彩色日志
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否安装了CloudBase CLI
check_tcb_cli() {
    if ! command -v tcb &> /dev/null; then
        log_error "CloudBase CLI (tcb) 未安装"
        log_info "请运行: npm install -g @cloudbase/cli"
        exit 1
    fi
    log_success "CloudBase CLI 已安装"
}

# 检查是否已登录CloudBase
check_tcb_login() {
    if ! tcb auth:list &> /dev/null; then
        log_error "未登录CloudBase"
        log_info "请运行: tcb login"
        exit 1
    fi
    log_success "CloudBase 已登录"
}

# 获取环境ID
get_env_id() {
    if [ -n "$1" ]; then
        ENV_ID="$1"
        log_info "使用指定的环境ID: $ENV_ID"
    else
        # 尝试从cloudbaserc.json读取
        if [ -f "cloudbaserc.json" ]; then
            ENV_ID=$(node -p "JSON.parse(require('fs').readFileSync('cloudbaserc.json', 'utf8')).envId" 2>/dev/null || echo "")
        fi
        
        if [ -z "$ENV_ID" ]; then
            log_error "未找到环境ID"
            log_info "请提供环境ID: ./scripts/deploy-voice-function.sh <ENV_ID>"
            log_info "或在cloudbaserc.json中配置envId"
            exit 1
        fi
        log_info "从配置文件读取环境ID: $ENV_ID"
    fi
}

# 检查云函数目录
check_function_dir() {
    FUNCTION_DIR="functions/voice-recognition"
    if [ ! -d "$FUNCTION_DIR" ]; then
        log_error "云函数目录不存在: $FUNCTION_DIR"
        exit 1
    fi
    
    if [ ! -f "$FUNCTION_DIR/index.js" ]; then
        log_error "云函数入口文件不存在: $FUNCTION_DIR/index.js"
        exit 1
    fi
    
    if [ ! -f "$FUNCTION_DIR/package.json" ]; then
        log_error "云函数配置文件不存在: $FUNCTION_DIR/package.json"
        exit 1
    fi
    
    log_success "云函数文件结构检查通过"
}

# 安装云函数依赖
install_dependencies() {
    log_info "安装云函数依赖..."
    cd "$FUNCTION_DIR"
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    cd - > /dev/null
    log_success "依赖安装完成"
}

# 部署云函数
deploy_function() {
    log_info "开始部署云函数: voice-recognition"
    log_info "目标环境: $ENV_ID"
    
    # 切换到云函数目录
    cd "$FUNCTION_DIR"
    
    # 执行部署
    if tcb functions:deploy voice-recognition --envId "$ENV_ID"; then
        log_success "云函数部署成功"
    else
        log_error "云函数部署失败"
        cd - > /dev/null
        exit 1
    fi
    
    cd - > /dev/null
}

# 验证部署
verify_deployment() {
    log_info "验证云函数部署..."
    
    # 获取云函数列表
    if tcb functions:list --envId "$ENV_ID" | grep -q "voice-recognition"; then
        log_success "云函数已成功部署到环境: $ENV_ID"
    else
        log_warning "云函数部署验证失败，请检查CloudBase控制台"
    fi
}

# 测试云函数
test_function() {
    log_info "测试云函数调用..."
    
    # 创建测试数据
    TEST_DATA='{
        "audioData": "dGVzdCBhdWRpbyBkYXRh",
        "audioFormat": "wav"
    }'
    
    # 调用云函数进行测试
    if tcb functions:invoke voice-recognition --envId "$ENV_ID" --params "$TEST_DATA" &> /dev/null; then
        log_success "云函数测试调用成功"
    else
        log_warning "云函数测试调用失败，这可能是因为缺少API配置"
        log_info "请确保已在CloudBase中配置科大讯飞API凭证"
    fi
}

# 显示后续配置步骤
show_next_steps() {
    echo ""
    log_info "=== 后续配置步骤 ==="
    echo ""
    echo "1. 配置科大讯飞API凭证（选择其中一种方式）："
    echo ""
    echo "   方式一：环境变量（推荐）"
    echo "   - 在CloudBase控制台 > 云函数 > voice-recognition > 环境变量中添加："
    echo "     XUNFEI_APP_ID=your_app_id"
    echo "     XUNFEI_API_SECRET=your_api_secret"
    echo "     XUNFEI_API_KEY=your_api_key"
    echo ""
    echo "   方式二：数据库配置"
    echo "   - 在CloudBase数据库中创建 app_config 集合"
    echo "   - 添加语音识别配置文档"
    echo ""
    echo "   方式三：文件存储配置"
    echo "   - 上传 voice-recognition-config.json 到文件存储"
    echo ""
    echo "2. 重启云函数使配置生效"
    echo ""
    echo "3. 在前端测试语音识别功能"
    echo ""
    log_info "详细配置说明请参考: CLOUDBASE_VOICE_SETUP.md"
    echo ""
}

# 主函数
main() {
    echo ""
    log_info "=== CloudBase语音识别云函数部署脚本 ==="
    echo ""
    
    # 检查前置条件
    check_tcb_cli
    check_tcb_login
    get_env_id "$1"
    check_function_dir
    
    # 安装依赖和部署
    install_dependencies
    deploy_function
    verify_deployment
    test_function
    
    # 显示后续步骤
    show_next_steps
    
    log_success "部署完成！"
}

# 错误处理
trap 'log_error "脚本执行失败，请检查错误信息"; exit 1' ERR

# 运行主函数
main "$@"