const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

beforeAll(async () => {
  const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/sharperly_logistics_test';
  await mongoose.connect(testDbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

beforeEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Authentication Endpoints', () => {
  describe('POST /api/auth/register', () => {
    const validUser = {
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'Password123',
      confirmPassword: 'Password123'
    };

    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Registration successful');
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(validUser.email);
      expect(res.body.user.fullName).toBe(validUser.fullName);
      expect(res.body.user.isEmailVerified).toBe(false);
    });

    it('should not register user with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          email: 'invalid-email'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });

    it('should not register user with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          password: '123',
          confirmPassword: '123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should not register user with existing email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        isEmailVerified: true
      });
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'Password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Login successful');
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(user.email);
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'WrongPassword123'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should not login with unverified email', async () => {
      await User.create({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123',
        isEmailVerified: false
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'Password123'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('verify your email');
      expect(res.body.requiresEmailVerification).toBe(true);
    });
  });

  describe('POST /api/auth/verify-email', () => {
    let user;
    let verificationCode;

    beforeEach(async () => {
      user = await User.create({
        fullName: 'Verify User',
        email: 'verify@example.com',
        password: 'Password123',
        isEmailVerified: false
      });
      verificationCode = user.generateEmailVerificationCode();
      await user.save({ validateBeforeSave: false });
    });

    it('should verify email with correct code', async () => {
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({
          verificationCode: verificationCode
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Email verified successfully');
      expect(res.body.user.isEmailVerified).toBe(true);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isEmailVerified).toBe(true);
      expect(updatedUser.emailVerificationCode).toBeUndefined();
      expect(updatedUser.emailVerificationExpire).toBeUndefined();
    });

    it('should not verify email with incorrect code', async () => {
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({
          verificationCode: '000000' 
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid or expired verification code');
    });

    it('should not verify email with expired code', async () => {
      user.emailVerificationExpire = Date.now() - 1000;
      await user.save({ validateBeforeSave: false });

      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({
          verificationCode: verificationCode
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid or expired verification code');
    });

    it('should not verify email without code', async () => {
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });
  });
});
