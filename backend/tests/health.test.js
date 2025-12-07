import request from 'supertest';
import app from '../src/app.js';

describe('Health endpoint', () => {
  it('responds with ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
