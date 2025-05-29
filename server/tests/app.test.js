const supertest = require('supertest');
const server = require('../app');
const db = require('../config/db');
const request = supertest.agent(server); // agent to persist cookies

// Helper to run SQL queries with promises
function query(sql) {
  return new Promise((resolve, reject) => {
    db.query(sql, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

describe('API Endpoints', () => {
  // const testUser = {
  //   name: 'TestUser',
  //   email: 'testuser@example.com',
  //   password: 'secret',
  //   newName: 'UpdatedUser',
  //   newPassword: 'newsecret',
  // };
  const randomSuffix = Math.floor(Math.random() * 100000);
  const testUser = {
    name: 'TestUser',
    email: `testuser${randomSuffix}@example.com`,
    password: 'secret',
    newName: 'UpdatedUser',
    newPassword: 'newsecret',
  };

  beforeAll(async () => {
    // Clean users table before tests
    //  await query('TRUNCATE TABLE users');
    await query("DELETE FROM users WHERE email LIKE 'testuser%@example.com'");
  });

  // afterAll(done => {
  //   server.close(done);
  //   db.end(); // close MySQL connection when tests finish
  // });

  afterAll(async () => {
    await query("DELETE FROM users WHERE email LIKE 'testuser%@example.com'");
    server.close();
    db.end(); // close MySQL connection when tests finish
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request.get('/api/unknownroute');
    expect(res.status).toBe(404);
  });

  it('should register a user', async () => {
    const res = await request.post('/api/register')
      .send(`name=${testUser.name}&email=${testUser.email}&password=${testUser.password}`)
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('should not allow registering with same email again', async () => {
    const res = await request.post('/api/register')
      .send(`name=${testUser.name}&email=${testUser.email}&password=${testUser.password}`)
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should login the user', async () => {
    const res = await request.post('/api/login')
      .send(`email=${testUser.email}&password=${testUser.password}`)
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('should get user profile when authenticated', async () => {
    const res = await request.get('/api/profile');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('should not get profile when unauthenticated', async () => {
    // Create a new request without cookies (new agent)
    const unauthRequest = supertest(server);
    const res = await unauthRequest.get('/api/profile');
    expect(res.status).toBe(401);
  });

  it('should update profile name', async () => {
    const res = await request.post('/api/update-profile')
      .send(`name=${testUser.newName}`)
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reflect updated name in profile', async () => {
    const res = await request.get('/api/profile');
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe(testUser.newName);
  });

  it('should reject update profile without name', async () => {
    const res = await request.post('/api/update-profile')
      .send('name=')
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(400);
  });

  it('should change password', async () => {
    const res = await request.post('/api/change-password')
      .send(`currentPassword=${testUser.password}&newPassword=${testUser.newPassword}`)
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject change password with wrong current password', async () => {
    const res = await request.post('/api/change-password')
      .send('currentPassword=wrongpassword&newPassword=doesntmatter')
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(401);
  });

  it('should login with new password after change', async () => {
    // We create a new agent for this login so cookie resets
    const newAgent = supertest.agent(server);
    const res = await newAgent.post('/api/login')
      .send(`email=${testUser.email}&password=${testUser.newPassword}`)
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should logout the user', async () => {
    const res = await request.post('/api/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject profile request after logout', async () => {
    const res = await request.get('/api/profile');
    expect(res.status).toBe(401);
  });
});