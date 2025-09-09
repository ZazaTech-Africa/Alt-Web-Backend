/**
 * Dashboard Schema Validator
 * 
 * This utility provides functions to validate API responses against the dashboard schema.
 * It can be used by frontend developers to ensure the API responses match the expected format.
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const dashboardSchema = require('../schemas/dashboardSchema.json');

class DashboardSchemaValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    
    // Compile schemas
    this.validators = {
      dashboardStats: this.ajv.compile(dashboardSchema.dashboardStats),
      dispatchSalesStats: this.ajv.compile(dashboardSchema.dispatchSalesStats),
      recentShipments: this.ajv.compile(dashboardSchema.recentShipments),
      dispatchHistory: this.ajv.compile(dashboardSchema.dispatchHistory),
      dispatcherDetails: this.ajv.compile(dashboardSchema.dispatcherDetails),
      errorResponse: this.ajv.compile(dashboardSchema.errorResponse)
    };
  }

  /**
   * Validate a response against a specific schema
   * @param {string} schemaName - The name of the schema to validate against
   * @param {object} data - The data to validate
   * @returns {object} - Validation result with isValid flag and any errors
   */
  validate(schemaName, data) {
    if (!this.validators[schemaName]) {
      return {
        isValid: false,
        errors: [`Schema '${schemaName}' not found`]
      };
    }

    const isValid = this.validators[schemaName](data);
    
    return {
      isValid,
      errors: isValid ? null : this.ajv.errorsText(this.validators[schemaName].errors)
    };
  }

  /**
   * Validate dashboard stats response
   * @param {object} data - The response data
   * @returns {object} - Validation result
   */
  validateDashboardStats(data) {
    return this.validate('dashboardStats', data);
  }

  /**
   * Validate dispatch sales stats response
   * @param {object} data - The response data
   * @returns {object} - Validation result
   */
  validateDispatchSalesStats(data) {
    return this.validate('dispatchSalesStats', data);
  }

  /**
   * Validate recent shipments response
   * @param {object} data - The response data
   * @returns {object} - Validation result
   */
  validateRecentShipments(data) {
    return this.validate('recentShipments', data);
  }

  /**
   * Validate dispatch history response
   * @param {object} data - The response data
   * @returns {object} - Validation result
   */
  validateDispatchHistory(data) {
    return this.validate('dispatchHistory', data);
  }

  /**
   * Validate dispatcher details response
   * @param {object} data - The response data
   * @returns {object} - Validation result
   */
  validateDispatcherDetails(data) {
    return this.validate('dispatcherDetails', data);
  }

  /**
   * Validate error response
   * @param {object} data - The response data
   * @returns {object} - Validation result
   */
  validateErrorResponse(data) {
    return this.validate('errorResponse', data);
  }
}

module.exports = new DashboardSchemaValidator();