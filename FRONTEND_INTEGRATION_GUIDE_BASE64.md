# Frontend Integration Guide for Base64 Image Handling

## Overview

This guide demonstrates how to implement base64 image handling for the KYC submission process. The approach converts images to base64 strings on the frontend before sending them to the backend as JSON data, which can improve reliability for file uploads.

## Frontend Implementation

### 1. Utility Functions for Base64 Conversion

First, create utility functions to handle file-to-base64 conversion:

```javascript
// utils/fileUtils.js

/**
 * Converts a file to a base64 string
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - A promise that resolves with the base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = () => {
      resolve(reader.result);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Validates file size and type
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @param {number} options.maxSizeMB - Maximum file size in MB
 * @param {Array<string>} options.allowedTypes - Array of allowed MIME types
 * @returns {boolean|string} - true if valid, error message if invalid
 */
export const validateFile = (file, { maxSizeMB = 5, allowedTypes = [] } = {}) => {
  if (!file) return 'No file provided';
  
  // Check file size
  const fileSizeInMB = file.size / (1024 * 1024);
  if (fileSizeInMB > maxSizeMB) {
    return `File size exceeds ${maxSizeMB}MB limit`;
  }
  
  // Check file type if allowedTypes is provided
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
  }
  
  return true;
};
```

### 2. KYC Submission Component

Here's an implementation of the KYC submission component using base64 encoding:

```jsx
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { fileToBase64, validateFile } from '../utils/fileUtils';

const BusinessKYC = () => {
  const [businessData, setBusinessData] = useState({
    businessName: '',
    businessEmail: '',
    businessAddress: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    cacRegistrationNumber: '',
    businessHotline: '',
    alternativePhoneNumber: '',
    wantSharperlyDriverOrders: false
  });
  
  const [proofOfAddressFile, setProofOfAddressFile] = useState(null);
  const [businessLogoFile, setBusinessLogoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects (address fields)
      const [parent, child] = name.split('.');
      setBusinessData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (name === 'wantSharperlyDriverOrders') {
      setBusinessData(prev => ({
        ...prev,
        [name]: e.target.checked
      }));
    } else {
      setBusinessData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle file changes with validation
  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;
    
    let validationOptions = {
      maxSizeMB: 5 // 5MB limit
    };
    
    if (fileType === 'proofOfAddress') {
      // Allow PDF, DOC, DOCX, and images for proof of address
      validationOptions.allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif'
      ];
    } else if (fileType === 'businessLogo') {
      // Allow only images for business logo
      validationOptions.allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/svg+xml'
      ];
    }
    
    const validationResult = validateFile(file, validationOptions);
    
    if (validationResult !== true) {
      toast.error(validationResult);
      e.target.value = ''; // Reset the input
      return;
    }
    
    if (fileType === 'proofOfAddress') {
      setProofOfAddressFile(file);
    } else if (fileType === 'businessLogo') {
      setBusinessLogoFile(file);
    }
  };
  
  // Submit KYC data with base64-encoded files
  const submitBusinessKYC = async () => {
    // Validate required fields
    if (!businessData.businessName || !businessData.businessEmail || !businessData.cacRegistrationNumber || 
        !businessData.businessHotline || !proofOfAddressFile) {
      toast.error('Please fill all required fields');
      return false;
    }
    
    // Validate address fields
    if (!businessData.businessAddress.street || !businessData.businessAddress.city || 
        !businessData.businessAddress.state || !businessData.businessAddress.country || 
        !businessData.businessAddress.zipCode) {
      toast.error('Please complete all address fields');
      return false;
    }
    
    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      // Convert files to base64
      let proofOfAddressBase64 = null;
      let businessLogoBase64 = null;
      
      if (proofOfAddressFile) {
        proofOfAddressBase64 = await fileToBase64(proofOfAddressFile);
      }
      
      if (businessLogoFile) {
        businessLogoBase64 = await fileToBase64(businessLogoFile);
      }
      
      // Prepare data for submission
      const submitData = {
        ...businessData,
        proofOfAddressBase64,
        businessLogoBase64
      };
      
      // Log data being sent (remove this in production)
      console.log('Submitting KYC with data:', {
        ...submitData,
        proofOfAddressBase64: proofOfAddressBase64 ? '[BASE64_DATA]' : null,
        businessLogoBase64: businessLogoBase64 ? '[BASE64_DATA]' : null
      });
      
      // Send data to the server
      const response = await axios.post(
        'https://alt-web-backend-g6do.onrender.com/api/business/kyc/base64',
        submitData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      toast.success('Business KYC submitted successfully!');
      setIsSubmitting(false);
      return true;
    } catch (error) {
      console.error('Error submitting business KYC:', error);
      console.error('Error response data:', error.response?.data);
      
      if (error.response?.data?.message === "CAC registration number already exists") {
        toast.error('This CAC registration number is already registered');
      } else if (error.response?.status === 400) {
        if (error.response?.data?.errors) {
          const validationErrors = error.response.data.errors.map(err => err.msg).join(', ');
          toast.error(`Validation error: ${validationErrors}`);
        } else {
          toast.error('Validation error: Please check your input fields');
        }
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Request timeout. Please try again.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to submit business information. Please try again.');
      }
      
      setIsSubmitting(false);
      throw error;
    }
  };
  
  return (
    <div className="business-kyc-form">
      {/* Form UI implementation */}
      {/* ... */}
      
      {/* File inputs */}
      <div className="form-group">
        <label htmlFor="proofOfAddress">Proof of Address (Required)</label>
        <input
          type="file"
          id="proofOfAddress"
          onChange={(e) => handleFileChange(e, 'proofOfAddress')}
          accept=".pdf,.doc,.docx,image/*"
          required
        />
        {proofOfAddressFile && (
          <div className="file-info">
            <span>Selected file: {proofOfAddressFile.name}</span>
          </div>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="businessLogo">Business Logo</label>
        <input
          type="file"
          id="businessLogo"
          onChange={(e) => handleFileChange(e, 'businessLogo')}
          accept="image/*"
        />
        {businessLogoFile && (
          <div className="file-info">
            <span>Selected file: {businessLogoFile.name}</span>
            {businessLogoFile.type.startsWith('image/') && (
              <img
                src={URL.createObjectURL(businessLogoFile)}
                alt="Business Logo Preview"
                className="logo-preview"
              />
            )}
          </div>
        )}
      </div>
      
      {/* Submit button */}
      <button
        type="button"
        onClick={submitBusinessKYC}
        disabled={isSubmitting}
        className="submit-button"
      >
        {isSubmitting ? 'Submitting...' : 'Submit KYC'}
      </button>
      
      {/* Progress bar */}
      {isSubmitting && (
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${uploadProgress}%` }}
          ></div>
          <span>{uploadProgress}%</span>
        </div>
      )}
    </div>
  );
};

export default BusinessKYC;
```

## Key Differences from Multipart Form Data Approach

1. **File Handling**: Files are converted to base64 strings using the `fileToBase64` utility function.

2. **API Endpoint**: The data is sent to the `/kyc/base64` endpoint instead of `/kyc`.

3. **Content Type**: The request uses `'Content-Type': 'application/json'` instead of `'multipart/form-data'`.

4. **Data Structure**: The entire payload is a JSON object with base64 strings for files, rather than a FormData object.

## Advantages of Base64 Approach

1. **Reliability**: Avoids issues with multipart form data parsing, especially with large files.

2. **Simplicity**: Single JSON payload instead of complex multipart boundaries.

3. **Debugging**: Easier to debug as the entire request is a single JSON object.

4. **Progress Tracking**: Still supports upload progress tracking.

## Considerations

1. **Payload Size**: Base64 encoding increases the size of the data by approximately 33%.

2. **Memory Usage**: Both client and server need to hold the entire file in memory.

3. **File Size Limits**: Be mindful of API gateway and server request size limits.

## Best Practices

1. **Validation**: Always validate files on the frontend before conversion to base64.

2. **Error Handling**: Implement robust error handling for both conversion and submission.

3. **Progress Indication**: Provide clear feedback to users during the upload process.

4. **Timeout Settings**: Set appropriate timeout values for larger uploads.