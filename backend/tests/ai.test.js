import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const mockAnomalyDetector = {
  getAnomalyStats: jest.fn().mockResolvedValue({ stats: [], unresolvedCount: 0 }),
  trainModel: jest.fn(),
  getModelInfo: jest.fn().mockResolvedValue(null),
  resolveAnomaly: jest.fn().mockResolvedValue({})
};

jest.unstable_mockModule('../src/services/ai/anomalyDetector.js', () => ({
  default: mockAnomalyDetector
}));

const mockPrisma = {
  anomaly: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null)
  }
};

jest.unstable_mockModule('../src/config/prisma.js', () => ({
  default: mockPrisma
}));

const { default: app } = await import('../src/app.js');

const adminToken = jwt.sign({ sub: 1, role: 'ADMIN' }, 'change-me');

describe('AI routes', () => {
  it('returns anomaly stats', async () => {
    const res = await request(app).get('/api/ai/stats').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('starts training', async () => {
    const res = await request(app).post('/api/ai/train-model').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(mockAnomalyDetector.trainModel).toHaveBeenCalled();
  });
});
