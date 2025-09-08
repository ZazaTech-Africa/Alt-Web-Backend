/**
 * KYC Form Schema
 * This schema represents the structure of the KYC form as shown in the frontend
 */

const kycSchema = {
  type: "object",
  properties: {
    businessName: {
      type: "string",
      description: "Business name"
    },
    businessEmail: {
      type: "string",
      format: "email",
      description: "Business email"
    },
    streetAddress: {
      type: "string",
      description: "Street address"
    },
    city: {
      type: "string",
      description: "City"
    },
    state: {
      type: "string",
      description: "State"
    },
    country: {
      type: "string",
      description: "Country"
    },
    zipCode: {
      type: "string",
      description: "Zip Code"
    },
    cacRegistrationNumber: {
      type: "string",
      description: "CAC Registration number"
    },
    proofOfAddress: {
      type: "string",
      format: "binary",
      description: "Proof of address (not more than 2-months old electricity bill)"
    },
    businessLogo: {
      type: "string",
      format: "binary",
      description: "Business logo (optional)"
    },
    businessHotline: {
      type: "string",
      description: "Business hotline"
    },
    alternativePhoneNumber: {
      type: "string",
      description: "Alternative phone number (optional)"
    },
    wantSharperlyDriverOrders: {
      type: "boolean",
      description: "Would you want sharperly to give your drivers orders?"
    }
  },
  required: [
    "businessName",
    "businessEmail",
    "streetAddress",
    "city",
    "state",
    "country",
    "cacRegistrationNumber",
    "proofOfAddress",
    "businessHotline",
    "wantSharperlyDriverOrders"
  ]
};

module.exports = kycSchema;