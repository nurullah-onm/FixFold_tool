import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const mockServerManager = {
  registerServer: jest.fn(),
  updateServer: jest.fn(),
  deleteServer: jest.fn(),
  healthCheck: jest.fn(),
  getServerStats: jest.fn(),
  syncConfigToServer: jest.fn(),
  autoBalance: jest.fn(),
  assignClientToServer: jest.fn(),
  migrateClient: jest.fn()
};

const mockPrisma = {
  server: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null)
  }
};

jest.unstable_mockModule('../src/services/server/serverManager.js', () => ({
  default: mockServerManager
}));

jest.unstable_mockModule('../src/config/prisma.js', () => ({
  default: mockPrisma
}));

const { default: app } = await import('../src/app.js');

const adminToken = jwt.sign({ sub: 1, role: 'ADMIN' }, 'change-me');

describe('Server routes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists servers', async () => {
    mockPrisma.server.findMany.mockResolvedValue([]);
    const res = await request(app).get('/api/servers').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('creates server', async () => {
    mockServerManager.registerServer.mockResolvedValue({ id: '1', name: 'srv' });
    const res = await request(app)
      .post('/api/servers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'srv', hostname: 'example.com', type: 'SLAVE' });
    expect(res.status).toBe(201);
    expect(mockServerManager.registerServer).toHaveBeenCalled();
  });

  it('triggers auto-balance', async () => {
    mockServerManager.autoBalance.mockResolvedValue({ migratedCount: 0 });
    const res = await request(app)
      .post('/api/servers/auto-balance')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
