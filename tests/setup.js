// Global test setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-sharperly-logistics';
process.env.MONGODB_TEST_URI = 'mongodb://localhost:27017/sharperly_logistics_test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock email sending in tests
jest.mock('../utils/sendEmail', () => {
  return jest.fn().mockResolvedValue({
    messageId: 'test-message-id'
  });
});

// Mock Cloudinary in tests
jest.mock('../config/cloudinary', () => ({
  uploader: {
    upload: jest.fn().mockResolvedValue({
      secure_url: 'https://test-cloudinary-url.com/test-image.jpg',
      public_id: 'test-public-id'
    })
  }
}));
