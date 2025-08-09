const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Business = require('../models/Business');
const Vehicle = require('../models/Vehicle');
const path = require('path');

beforeAll(async () => {
  const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/sharperly_logistics_test';
  await mongoose.connect(testDbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

beforeEach(async () => {
  await User.deleteMany({});
  await Business.deleteMany({});
  await Vehicle.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Business Endpoints', () => {
  let user;
  let token;

  beforeEach(async () => {
    user = await User.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'Password123',
      isEmailVerified: true
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john@example.com',
        password: 'Password123'
      });
    
    token = loginRes.body.token;
  });

  describe('POST /api/business/kyc', () => {
    const validKYCData = {
      businessName: 'Test Logistics Ltd',
      businessEmail: 'business@test.com',
      businessAddress: JSON.stringify({
        street: '123 Business Street',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria'
      }),
      cacRegistrationNumber: 'RC123456789',
      businessHotline: '+2348012345678',
      alternativePhoneNumber: '+2348087654321',
      wantSharperlyDriverOrders: 'true'
    };

    it('should submit KYC successfully with file upload', async () => {
      const testFilePath = path.join(__dirname, 'fixtures', 'test-document.pdf');
      
      const res = await request(app)
        .post('/api/business/kyc')
        .set('Authorization', `Bearer ${token}`)
        .field('businessName', validKYCData.businessName)
        .field('businessEmail', validKYCData.businessEmail)
        .field('businessAddress', validKYCData.businessAddress)
        .field('cacRegistrationNumber', validKYCData.cacRegistrationNumber)
        .field('businessHotline', validKYCData.businessHotline)
        .field('wantSharperlyDriverOrders', validKYCData.wantSharperlyDriverOrders)
        .attach('proofOfAddress', Buffer.from('fake pdf content'), 'test.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('KYC submitted successfully');
      expect(res.body.business.businessName).toBe(validKYCData.businessName);
    });

    it('should not submit KYC without proof of address', async () => {
      const res = await request(app)
        .post('/api/business/kyc')
        .set('Authorization', `Bearer ${token}`)
        .send(validKYCData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Proof of address document is required');
    });

    it('should not submit KYC without authentication', async () => {
      const res = await request(app)
        .post('/api/business/kyc')
        .send(validKYCData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/business/vehicles', () => {
    let business;

    beforeEach(async () => {
      business = await Business.create({
        user: user._id,
        businessName: 'Test Logistics Ltd',
        businessEmail: 'business@test.com',
        businessAddress: {
          street: '123 Business Street',
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria'
        },
        cacRegistrationNumber: 'RC123456789',
        proofOfAddress: 'https://example.com/proof.pdf',
        businessHotline: '+2348012345678',
        wantSharperlyDriverOrders: true
      });

      await User.findByIdAndUpdate(user._id, { hasCompletedKYC: true });
    });

    const validVehicleData = {
      numberOfDrivers: 5,
      numberOfCars: 3,
      numberOfBikes: 2,
      numberOfVans: 1
    };

    it('should register vehicles successfully', async () => {
      const res = await request(app)
        .post('/api/business/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send(validVehicleData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Vehicles registered successfully');
      expect(res.body.vehicles.numberOfDrivers).toBe(validVehicleData.numberOfDrivers);
      expect(res.body.vehicles.totalVehicles).toBe(6);
    });

    it('should not register vehicles without completing KYC', async () => {
      const newUser = await User.create({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123',
        isEmailVerified: true
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'Password123'
        });

      const res = await request(app)
        .post('/api/business/vehicles')
        .set('Authorization', `Bearer ${loginRes.body.token}`)
        .send(validVehicleData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('complete business KYC first');
    });

    it('should validate vehicle numbers are non-negative', async () => {
      const res = await request(app)
        .post('/api/business/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...validVehicleData,
          numberOfCars: -1
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });
  });
});
