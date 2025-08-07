// 健康检查路由 - 用于容器部署的健康检查
export async function GET() {
  return Response.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'suiyue-memoir',
    version: '1.0.1',
    environment: 'production',
    lastDeployment: '2025-08-07T13:20:00Z'
  });
}