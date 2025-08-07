const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Business = require('../models/Business');
const Order = require('../models/Order');
const Shipment = require('../models/Shipment');
const Driver = require('../models/Driver');

// Test database connection
beforeAll(async () => {
  const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/sharperly_logistics_test';
  await mongoose.connect(testDbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Clean up database before each test
beforeEach(async () => {
  await User.deleteMany({});
  await Business.deleteMany({});
  await Order.deleteMany({});
  await Shipment.deleteMany({});
  await Driver.deleteMany({});
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Dashboard Endpoints', () => {
  let user;
  let business;
  let token;

  beforeEach(async () => {
    // Create user and business
    user = await User.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'Password123',
      isEmailVerified: true,
      hasCompletedOnboarding: true
    });

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

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john@example.com',
        password: 'Password123'
      });
    
    token = loginRes.body.token;
  });

  describe('GET /api/dashboard/stats', () => {
    beforeEach(async () => {
      // Create test orders
      await Order.create([
        {
          user: user._id,
          business: business._id,
          itemsCount: 5,
          description: 'Test order 1',
          quantity: 10,
          pickupLocation: { address: 'Pickup 1' },
          deliveryLocation: { address: 'Delivery 1' },
          requestedDeliveryDate: new Date(),
          vehicleType: 'car',
          estimatedCost: 5000,
          status: 'delivered',
          actualCost: 5000
        },
        {
          user: user._id,
          business: business._id,
          itemsCount: 3,
          description: 'Test order 2',
          quantity: 5,
          pickupLocation: { address: 'Pickup 2' },
          deliveryLocation: { address: 'Delivery 2' },
          requestedDeliveryDate: new Date(),
          vehicleType: 'bike',
          estimatedCost: 3000,
          status: 'pending'
        },
        {
          user: user._id,
          business: business._id,
          itemsCount: 2,
          description: 'Test order 3',
          quantity: 3,
          pickupLocation: { address: 'Pickup 3' },
          deliveryLocation: { address: 'Delivery 3' },
          requestedDeliveryDate: new Date(),
          vehicleType: 'van',
          estimatedCost: 7000,
          status: 'in_transit'
        }
      ]);
    });

    it('should get dashboard statistics successfully', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.totalDispatchCount).toBe(3);
      expect(res.body.stats.pendingDispatchCount).toBe(1);
      expect(res.body.stats.activeDispatchCount).toBe(1); // in_transit
      expect(res.body.stats.successfulDispatchCount).toBe(1); // delivered
      expect(res.body.stats.totalRevenue).toBe(5000);
    });

    it('should not get stats without authentication', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/dashboard/recent-shipments', () => {
    beforeEach(async () => {
      // Create test driver
      const driver = await Driver.create({
        fullName: 'Test Driver',
        email: 'driver@test.com',
        phoneNumber: '+2348012345678',
        licenseNumber: 'LIC123456',
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        vehicleType: 'car',
        vehicleDetails: {
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          plateNumber: 'ABC123XY',
          color: 'Blue'
        },
        rating: 4.5
      });

      // Create test order
      const order = await Order.create({
        user: user._id,
        business: business._id,
        itemsCount: 5,
        description: 'Test order',
        quantity: 10,
        pickupLocation: { address: 'Pickup Location' },
        deliveryLocation: { address: 'Delivery Location' },
        requestedDeliveryDate: new Date(),
        vehicleType: 'car',
        estimatedCost: 5000,
        status: 'delivered'
      });

      // Create test shipment
      await Shipment.create({
        order: order._id,
        user: user._id,
        driver: driver._id,
        dispatcherName: 'John Doe',
        itemsNo: 5,
        orderDate: new Date(),
        dispatchDate: new Date(),
        dispatchLocation: 'Lagos',
        quantity: 10,
        dispatchStatus: 'delivered',
        customerRating: 5
      });
    });

    it('should get recent shipments successfully', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent-shipments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.shipments).toBeDefined();
      expect(res.body.shipments.length).toBe(1);
      expect(res.body.shipments[0].dispatcherName).toBe('John Doe');
      expect(res.body.shipments[0].driverName).toBe('Test Driver');
      expect(res.body.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent-shipments?limit=5&page=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.pagination.currentPage).toBe(1);
      expect(res.body.pagination.totalShipments).toBe(1);
    });
  });
});
