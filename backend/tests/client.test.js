import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const mockClientService = {
  createClient: jest.fn(),
  bulkCreateClients: jest.fn(),
  getClients: jest.fn(),
  getClientById: jest.fn(),
  updateClient: jest.fn(),
  deleteClient: jest.fn(),
  toggleClient: jest.fn(),
  resetClientTraffic: jest.fn(),
  getClientStats: jest.fn()
};

const mockQrService = {
  generateQRCode: jest.fn()
};

const mockSubscriptionService = {
  generateSubscription: jest.fn(),
  getSubscriptionInfo: jest.fn()
};

jest.unstable_mockModule('../src/services/client/clientService.js', () => ({
  default: mockClientService
}));

jest.unstable_mockModule('../src/services/client/qrcodeService.js', () => ({
  default: mockQrService
}));

jest.unstable_mockModule('../src/services/client/subscriptionService.js', () => ({
  default: mockSubscriptionService
}));

const { default: app } = await import('../src/app.js');

const adminToken = jwt.sign({ sub: 1, role: 'ADMIN' }, 'change-me');

describe('Client routes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates client', async () => {
    mockClientService.createClient.mockResolvedValue({ id: '1', email: 'a@b.com' });
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ inboundId: 'in1', email: 'a@b.com', settings: {}, totalGB: 0 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(mockClientService.createClient).toHaveBeenCalled();
  });

  it('bulk creates clients', async () => {
    mockClientService.bulkCreateClients.mockResolvedValue({ count: 2 });
    const res = await request(app)
      .post('/api/clients/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ inboundId: 'in1', count: 2, template: {} });
    expect(res.status).toBe(201);
    expect(res.body.data.count).toBe(2);
  });

  it('gets clients', async () => {
    mockClientService.getClients.mockResolvedValue({ clients: [], total: 0, page: 1, pages: 1 });
    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns client qrcode', async () => {
    mockQrService.generateQRCode.mockResolvedValue({ qrcode: 'data:image/png', link: 'vmess://...' });
    const res = await request(app)
      .get('/api/clients/1/qrcode')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.qrcode).toBeDefined();
  });

  it('returns public subscription', async () => {
    mockSubscriptionService.generateSubscription.mockResolvedValue('YmFzZTY0');
    const res = await request(app).get('/api/subscription/abc');
    expect(res.status).toBe(200);
    expect(res.body.data.subscription).toBe('YmFzZTY0');
  });
});
