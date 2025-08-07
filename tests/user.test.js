const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

// Test database connection
beforeAll(async () => {
  const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/sharperly_test';
  await mongoose.connect(testDbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Clean up database before each test
beforeEach(async () => {
  await User.deleteMany({});
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('User Endpoints', () => {
  let user;
  let token;
  let adminUser;
  let adminToken;

  beforeEach(async () => {
    // Create regular user
    user = await User.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'Password123',
      isEmailVerified: true
    });

    // Create admin user
    adminUser = await User.create({
      fullName: 'Admin User',
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin',
      isEmailVerified: true
    });

    // Get tokens
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john@example.com',
        password: 'Password123'
      });
    token = loginRes.body.token;

    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Password123'
      });
    adminToken = adminLoginRes.body.token;
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(user.email);
      expect(res.body.user.fullName).toBe(user.fullName);
    });

    it('should not get profile without token', async () => {
      const res = await request(app)
        .get('/api/users/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const updateData = {
        fullName: 'John Updated',
        phoneNumber: '+1234567890'
      };

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('updated successfully');
      expect(res.body.user.fullName).toBe(updateData.fullName);
      expect(res.body.user.phoneNumber).toBe(updateData.phoneNumber);
    });

    it('should not update profile without token', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .send({
          fullName: 'John Updated'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/users (Admin only)', () => {
    it('should get all users as admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.users).toBeDefined();
      expect(res.body.count).toBe(2); // user + admin
    });

    it('should not get all users as regular user', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not authorized');
    });
  });

  describe('DELETE /api/users/account', () => {
    it('should delete user account', async () => {
      const res = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted successfully');

      // Verify user was deleted
      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });
  });
});
