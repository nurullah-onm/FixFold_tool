import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const mockInboundService = {
  createInbound: jest.fn(),
  getInbounds: jest.fn(),
  getInboundById: jest.fn(),
  updateInbound: jest.fn(),
  deleteInbound: jest.fn(),
  toggleInbound: jest.fn(),
  restartInbound: jest.fn(),
  getInboundStats: jest.fn()
};

jest.unstable_mockModule('../src/services/inbound/inboundService.js', () => ({
  default: mockInboundService
}));

const { default: app } = await import('../src/app.js');

const adminToken = jwt.sign({ sub: 1, role: 'ADMIN' }, 'change-me');

describe('Inbound routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates inbound successfully', async () => {
    mockInboundService.createInbound.mockResolvedValue({ id: '1', remark: 'test', port: 3001 });

    const res = await request(app)
      .post('/api/inbounds')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        remark: 'test',
        protocol: 'VMESS',
        port: 3001,
        settings: { clients: [{ id: 'uuid', email: 'a@b.com' }] }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(mockInboundService.createInbound).toHaveBeenCalled();
  });

  it('rejects duplicate port error', async () => {
    const err = new Error('Port already in use');
    err.status = 409;
    mockInboundService.createInbound.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/inbounds')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        remark: 'test',
        protocol: 'VMESS',
        port: 3001,
        settings: { clients: [{ id: 'uuid', email: 'a@b.com' }] }
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('lists inbounds paginated', async () => {
    mockInboundService.getInbounds.mockResolvedValue({ inbounds: [], total: 0, page: 1, pages: 1 });

    const res = await request(app)
      .get('/api/inbounds')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('toggles inbound', async () => {
    mockInboundService.toggleInbound.mockResolvedValue({ isActive: false });

    const res = await request(app)
      .post('/api/inbounds/1/toggle')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  it('gets inbound stats', async () => {
    mockInboundService.getInboundStats.mockResolvedValue({ up: 0, down: 0 });
    const res = await request(app)
      .get('/api/inbounds/1/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
