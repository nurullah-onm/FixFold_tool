import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';

const testUser = {
  username: `user_${Date.now()}`,
  email: `user_${Date.now()}@example.com`,
  password: 'password123'
};

beforeAll(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Auth flows', () => {
  it('registers a user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: testUser.username, password: 'wrongpass' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('verifies JWT for protected route', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: testUser.password });
    const token = loginRes.body.data.accessToken;

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
