// 健康检查路由 - 用于容器部署的健康检查
export async function GET() {
  return Response.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'suiyue-memoir'
  });
}