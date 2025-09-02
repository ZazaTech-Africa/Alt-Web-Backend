# Testing Guide for Base64 Image Implementation

## Overview

This guide provides step-by-step instructions for testing the Base64 image handling implementation for the KYC process. The testing process will verify that both the backend and frontend components work correctly together.

## Prerequisites

- Backend server running locally or deployed
- Frontend application running locally or deployed
- Access to a user account with appropriate permissions
- Sample files for testing:
  - A business logo image (PNG, JPEG, or SVG format, under 5MB)
  - A proof of address document (PDF, DOC, DOCX, or image format, under 5MB)

## Backend Testing

### 1. Test the Base64 Decoding Utility

Before testing the full flow, you can verify the Base64 decoding utility works correctly:

```javascript
// Create a simple test script (test-base64.js)
const fileHandler = require('./utils/fileHandler');
const fs = require('fs');

// Read a test image file
const testImagePath = './test-image.png'; // Replace with an actual test image
const imageBuffer = fs.readFileSync(testImagePath);
const base64String = `data:image/png;base64,${imageBuffer.toString('base64')}`;

// Test the decoding and saving function
async function testDecoding() {
  try {
    const savedFilePath = await fileHandler.decodeBase64AndSaveFile(base64String, 'test-output');
    console.log('File saved successfully at:', savedFilePath);
    
    // Verify the file exists
    if (fs.existsSync(savedFilePath)) {
      console.log('File exists on disk ✅');
    } else {
      console.log('File does not exist on disk ❌');
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testDecoding();
```

Run this script with Node.js:

```bash
node test-base64.js
```

### 2. Test the Base64 API Endpoint

Use a tool like Postman or curl to test the `/api/business/kyc/base64` endpoint:

```bash
curl -X POST \
  http://localhost:3000/api/business/kyc/base64 \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "businessName": "Test Business",
    "businessEmail": "test@example.com",
    "businessAddress": {
      "street": "123 Test St",
      "city": "Test City",
      "state": "Test State",
      "country": "Test Country",
      "zipCode": "12345"
    },
    "cacRegistrationNumber": "TEST12345",
    "businessHotline": "1234567890",
    "alternativePhoneNumber": "0987654321",
    "proofOfAddressBase64": "data:application/pdf;base64,BASE64_STRING_HERE",
    "businessLogoBase64": "data:image/png;base64,BASE64_STRING_HERE"
  }'
```

Replace `BASE64_STRING_HERE` with actual Base64 encoded strings of your test files.

## Frontend Testing

### 1. Test File Selection and Preview

1. Open the KYC submission form in your frontend application
2. Select a business logo image file
3. Verify that:
   - The file name is displayed
   - A preview of the image is shown
   - No errors are displayed
4. Select a proof of address document
5. Verify that:
   - The file name is displayed
   - No errors are displayed

### 2. Test File Validation

1. Try selecting an oversized file (>5MB)
2. Verify that an appropriate error message is displayed
3. Try selecting a file with an invalid type for each field
4. Verify that an appropriate error message is displayed

### 3. Test Form Submission

1. Fill in all required fields with valid data
2. Select valid files for both proof of address and business logo
3. Click the submit button
4. Verify that:
   - The progress bar appears and updates
   - The form shows a loading state
   - Upon successful submission, a success message is displayed

### 4. Test Error Handling

1. Submit a form with a duplicate CAC registration number
2. Verify that an appropriate error message is displayed
3. Disconnect from the internet and try submitting
4. Verify that an appropriate network error message is displayed

## End-to-End Testing

### 1. Complete KYC Submission

1. Log in to the application
2. Navigate to the KYC submission form
3. Fill in all required fields
4. Upload valid files for proof of address and business logo
5. Submit the form
6. Verify successful submission

### 2. Verify Database Entry

Check the database to ensure:

1. A new business entry has been created with the correct information
2. The `proofOfAddress` and `businessLogo` fields contain URLs to the uploaded files, not Base64 strings
3. The user's `hasCompletedKYC` status has been updated

### 3. Verify File Storage

1. Access the Cloudinary dashboard
2. Verify that the files have been uploaded with the correct format
3. Check that the files are accessible via the URLs stored in the database

## Performance Testing

### 1. Test with Various File Sizes

Repeat the submission process with files of different sizes to ensure performance is acceptable:

- Small files (<100KB)
- Medium files (1-2MB)
- Large files (close to the 5MB limit)

### 2. Test Network Performance

Test the submission process under different network conditions:

- Fast connection
- Slow connection (you can use browser dev tools to simulate this)
- Intermittent connection

## Compatibility Testing

Test the implementation across different browsers and devices:

- Chrome
- Firefox
- Safari
- Edge
- Mobile devices (iOS and Android)

## Troubleshooting Common Issues

### Backend Issues

1. **File Decoding Errors**
   - Check that the Base64 string is properly formatted with the correct MIME type prefix
   - Verify that the temporary directory has write permissions

2. **Cloudinary Upload Errors**
   - Check Cloudinary credentials
   - Verify network connectivity to Cloudinary services

### Frontend Issues

1. **File Conversion Errors**
   - Check browser console for JavaScript errors
   - Verify that the FileReader API is supported in the browser

2. **Form Submission Errors**
   - Check network tab in browser dev tools for request/response details
   - Verify that the correct endpoint is being used (/kyc/base64)
   - Ensure the authorization token is valid

## Conclusion

By following this testing guide, you should be able to verify that the Base64 image handling implementation works correctly for the KYC process. If any issues are encountered, refer to the troubleshooting section or check the server logs for more detailed error information.