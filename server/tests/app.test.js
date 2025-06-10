const supertest = require('supertest');
const server = require('../app');
const db = require('../config/db');
const request = supertest.agent(server); // Create an agent to keep cookies between requests

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
  // Generate a random suffix to avoid email conflicts in tests
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

  afterAll(async () => {
    // Clean test users after tests complete
    await query("DELETE FROM users WHERE email LIKE 'testuser%@example.com'");
    server.close();
    db.end(); // close MySQL connection when tests finish
  });

  it('should return 404 for unknown routes', async () => {
    // Test that a request to an unknown API route returns 404 status
    const res = await request.get('/api/unknownroute');
    expect(res.status).toBe(404);
  });

  it('should register a user', async () => {
    // Test user registration endpoint
    const res = await request.post('/api/register')
      .send(`name=${testUser.name}&email=${testUser.email}&password=${testUser.password}`)
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('should not allow registering with same email again', async () => {
    // Test that registering with an existing email returns 409 conflict
    const res = await request.post('/api/register')
      .send(`name=${testUser.name}&email=${testUser.email}&password=${testUser.password}`)
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should login the user', async () => {
    // Test user login endpoint
    const res = await request.post('/api/login')
      .send(`email=${testUser.email}&password=${testUser.password}`)
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('should get user profile when authenticated', async () => {
    // Test retrieving profile after login (should succeed)
    const res = await request.get('/api/profile');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('should not get profile when unauthenticated', async () => {
    // Create a new request without cookies (unauthenticated)
    const unauthRequest = supertest(server);
    const res = await unauthRequest.get('/api/profile');
    expect(res.status).toBe(401); // Unauthorized expected
  });

  it('should update profile name', async () => {
    // Test updating user profile name
    const res = await request.post('/api/update-profile')
      .send(`name=${testUser.newName}`)
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reflect updated name in profile', async () => {
    // Confirm the updated name is shown in the profile
    const res = await request.get('/api/profile');
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe(testUser.newName);
  });

  it('should reject update profile without name', async () => {
    // Test that updating profile with empty name is rejected with 400 Bad Request
    const res = await request.post('/api/update-profile')
      .send('name=')
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(400);
  });

  it('should change password', async () => {
    // Test password change endpoint with correct current password
    const res = await request.post('/api/change-password')
      .send(`currentPassword=${testUser.password}&newPassword=${testUser.newPassword}`)
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject change password with wrong current password', async () => {
    // Test password change with incorrect current password (should fail)
    const res = await request.post('/api/change-password')
      .send('currentPassword=wrongpassword&newPassword=doesntmatter')
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(401);
  });

  it('should login with new password after change', async () => {
    // Test login with the new password after password change
    const newAgent = supertest.agent(server); // new agent to reset cookies
    const res = await newAgent.post('/api/login')
      .send(`email=${testUser.email}&password=${testUser.newPassword}`)
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should logout the user', async () => {
    // Test logout endpoint
    const res = await request.post('/api/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject profile request after logout', async () => {
    // After logout, accessing profile should be unauthorized
    const res = await request.get('/api/profile');
    expect(res.status).toBe(401);
  });
});

// import supertest from 'supertest';
// import { expect } from 'chai';
// import server from '../app.js';
// import db from '../config/db.js';
// const request = supertest.agent(server); // Keeps cookies

// // Helper to run SQL queries with promises
// function query(sql) {
//   return new Promise((resolve, reject) => {
//     db.query(sql, (err, results) => {
//       if (err) reject(err);
//       else resolve(results);
//     });
//   });
// }

// describe('API Endpoints', function () {
//   // Generate a random suffix to avoid email conflicts in tests
//   const randomSuffix = Math.floor(Math.random() * 100000);
//   const testUser = {
//     name: 'TestUser',
//     email: `testuser${randomSuffix}@example.com`,
//     password: 'secret',
//     newName: 'UpdatedUser',
//     newPassword: 'newsecret',
//   };

//   before(async function () {
//     await query("DELETE FROM users WHERE email LIKE 'testuser%@example.com'");
//   });

//   after(async function () {
//     await query("DELETE FROM users WHERE email LIKE 'testuser%@example.com'");
//     server.close();
//     db.end();
//   });

//   it('should return 404 for unknown routes', async function () {
//     const res = await request.get('/api/unknownroute');
//     expect(res.status).to.equal(404);
//   });

//   it('should register a user', async function () {
//     const res = await request.post('/api/register')
//       .send(`name=${testUser.name}&email=${testUser.email}&password=${testUser.password}`)
//       .set('Content-Type', 'application/x-www-form-urlencoded');

//     expect(res.status).to.equal(201);
//     expect(res.body.success).to.be.true;
//   });

//   it('should not allow registering with same email again', async function () {
//     const res = await request.post('/api/register')
//       .send(`name=${testUser.name}&email=${testUser.email}&password=${testUser.password}`)
//       .set('Content-Type', 'application/x-www-form-urlencoded');

//     expect(res.status).to.equal(409);
//     expect(res.body.success).to.be.false;
//   });

//   it('should login the user', async function () {
//     const res = await request.post('/api/login')
//       .send(`email=${testUser.email}&password=${testUser.password}`)
//       .set('Content-Type', 'application/x-www-form-urlencoded');

//     expect(res.status).to.equal(200);
//     expect(res.body.success).to.be.true;
//     expect(res.body.user.email).to.equal(testUser.email);
//   });

//   it('should get user profile when authenticated', async function () {
//     const res = await request.get('/api/profile');
//     expect(res.status).to.equal(200);
//     expect(res.body.success).to.be.true;
//     expect(res.body.user.email).to.equal(testUser.email);
//   });

//   it('should not get profile when unauthenticated', async function () {
//     const unauthRequest = supertest(server);
//     const res = await unauthRequest.get('/api/profile');
//     expect(res.status).to.equal(401);
//   });

//   it('should update profile name', async function () {
//     const res = await request.post('/api/update-profile')
//       .send(`name=${testUser.newName}`)
//       .set('Content-Type', 'application/x-www-form-urlencoded');

//     expect(res.status).to.equal(200);
//     expect(res.body.success).to.be.true;
//   });

//   it('should reflect updated name in profile', async function () {
//     const res = await request.get('/api/profile');
//     expect(res.status).to.equal(200);
//     expect(res.body.user.name).to.equal(testUser.newName);
//   });

//   it('should reject update profile without name', async function () {
//     const res = await request.post('/api/update-profile')
//       .send('name=')
//       .set('Content-Type', 'application/x-www-form-urlencoded');

//     expect(res.status).to.equal(400);
//   });

//   it('should change password', async function () {
//     const res = await request.post('/api/change-password')
//       .send(`currentPassword=${testUser.password}&newPassword=${testUser.newPassword}`)
//       .set('Content-Type', 'application/x-www-form-urlencoded');

//     expect(res.status).to.equal(200);
//     expect(res.body.success).to.be.true;
//   });

//   it('should reject change password with wrong current password', async function () {
//     const res = await request.post('/api/change-password')
//       .send('currentPassword=wrongpassword&newPassword=doesntmatter')
//       .set('Content-Type', 'application/x-www-form-urlencoded');

//     expect(res.status).to.equal(401);
//   });

//   it('should login with new password after change', async function () {
//     const newAgent = supertest.agent(server);
//     const res = await newAgent.post('/api/login')
//       .send(`email=${testUser.email}&password=${testUser.newPassword}`)
//       .set('Content-Type', 'application/x-www-form-urlencoded');

//     expect(res.status).to.equal(200);
//     expect(res.body.success).to.be.true;
//   });

//   it('should logout the user', async function () {
//     const res = await request.post('/api/logout');
//     expect(res.status).to.equal(200);
//     expect(res.body.success).to.be.true;
//   });

//   it('should reject profile request after logout', async function () {
//     const res = await request.get('/api/profile');
//     expect(res.status).to.equal(401);
//   });
// });
