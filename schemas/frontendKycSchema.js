/**
 * Frontend KYC Form Schema
 * This schema represents the structure of the KYC form for frontend implementation
 * based on the backend model structure.
 */

const frontendKycSchema = {
  // Form field structure for frontend implementation
  formFields: {
    businessName: {
      type: "text",
      label: "Business name *",
      placeholder: "Enter business name",
      required: true,
      maxLength: 200
    },
    businessEmail: {
      type: "email",
      label: "Business email *",
      placeholder: "Enter business email",
      required: true
    },
    streetAddress: {
      type: "text",
      label: "Street address *",
      placeholder: "Enter street address",
      required: true
    },
    city: {
      type: "text",
      label: "City *",
      placeholder: "Enter city",
      required: true
    },
    state: {
      type: "text",
      label: "State *",
      placeholder: "Enter state",
      required: true
    },
    country: {
      type: "text",
      label: "Country *",
      placeholder: "Enter country",
      required: true,
      defaultValue: "Nigeria"
    },
    zipCode: {
      type: "text",
      label: "Zip Code",
      placeholder: "Enter zip code",
      required: false
    },
    cacRegistrationNumber: {
      type: "text",
      label: "CAC Registration number *",
      placeholder: "Enter CAC registration number",
      required: true
    },
    proofOfAddress: {
      type: "file",
      label: "Proof of address (not more than 2-months old electricity bill) *",
      required: true,
      accept: ".pdf,.doc,.docx,.png,.jpg,.jpeg"
    },
    businessLogo: {
      type: "file",
      label: "Business logo",
      required: false,
      accept: ".png,.jpg,.jpeg,.svg"
    },
    businessHotline: {
      type: "tel",
      label: "Business hotline *",
      placeholder: "Enter business hotline",
      required: true
    },
    alternativePhoneNumber: {
      type: "tel",
      label: "Alternative phone number",
      placeholder: "Enter alternative phone number",
      required: false
    },
    wantSharperlyDriverOrders: {
      type: "checkbox",
      label: "Would you want sharperly to give your drivers orders?",
      required: true,
      defaultValue: false
    }
  },
  
  // API request payload structure
  apiPayload: {
    businessName: "string",
    businessEmail: "string",
    streetAddress: "string",
    city: "string",
    state: "string",
    country: "string",
    zipCode: "string",
    cacRegistrationNumber: "string",
    proofOfAddressBase64: "string", // Base64 encoded file
    businessLogoBase64: "string", // Base64 encoded file (optional)
    businessHotline: "string",
    alternativePhoneNumber: "string", // Optional
    wantSharperlyDriverOrders: "boolean"
  },
  
  // Example API response structure
  apiResponse: {
    success: true,
    message: "Business KYC submitted successfully",
    business: {
      _id: "string",
      user: "string",
      businessName: "string",
      businessEmail: "string",
      businessStreet: "string",
      businessCity: "string",
      businessState: "string",
      businessCountry: "string",
      businessZipCode: "string",
      cacRegistrationNumber: "string",
      proofOfAddress: "string", // URL to uploaded file
      businessLogo: "string", // URL to uploaded file
      businessHotline: "string",
      alternativePhoneNumber: "string",
      wantSharperlyDriverOrders: true,
      isVerified: false,
      verificationStatus: "pending",
      totalOrders: 0,
      completedOrders: 0,
      rating: 0,
      createdAt: "2023-01-01T00:00:00.000Z",
      updatedAt: "2023-01-01T00:00:00.000Z"
    }
  }
};

module.exports = frontendKycSchema;