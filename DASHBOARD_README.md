# Dashboard Integration Guide

## Overview

This guide provides resources for integrating with the Alt-Web-Backend dashboard API. The dashboard provides statistics, sales data, shipment information, dispatch history, and dispatcher details for logistics management.

## Available Resources

1. **API Documentation**
   - File: `DASHBOARD_API_DOCUMENTATION.md`
   - Contains detailed information about all dashboard endpoints, request/response formats, and integration guidelines.

2. **JSON Schema**
   - File: `schemas/dashboardSchema.json`
   - Provides JSON schema definitions for validating API responses.

3. **Schema Validator**
   - File: `utils/dashboardSchemaValidator.js`
   - A utility class for validating API responses against the schema.

4. **Integration Example**
   - File: `examples/dashboardIntegration.js`
   - Example JavaScript code showing how to integrate with the dashboard API.

## Quick Start

### 1. Authentication

All dashboard endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### 2. Base URL

All API endpoints are prefixed with `/api/dashboard`

### 3. Available Endpoints

- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/dispatch-sales` - Get dispatch sales statistics
- `GET /api/dashboard/recent-shipments` - Get recent shipments
- `GET /api/dashboard/history` - Get dispatch history
- `GET /api/dashboard/dispatcher-details` - Get dispatcher details

### 4. Example Usage

```javascript
// Using the DashboardService from examples/dashboardIntegration.js

// Get dashboard statistics
const stats = await DashboardService.getDashboardStats();

// Get sales data for the last 7 days
const salesData = await DashboardService.getDispatchSalesStats('7days');

// Get recent shipments (page 1, 10 items per page)
const shipments = await DashboardService.getRecentShipments(1, 10);

// Get dispatch history with filters
const history = await DashboardService.getDispatchHistory({
  page: 1,
  limit: 20,
  status: 'delivered',
  startDate: '2023-01-01',
  endDate: '2023-12-31',
  search: 'customer name'
});

// Get dispatcher details
const dispatcherDetails = await DashboardService.getDispatcherDetails();
```

## Dashboard UI Components

The dashboard API is designed to support the following UI components:

1. **Statistics Cards**
   - Total, Active, Pending, and Successful Dispatches with counts and percentage changes

2. **Sales Chart**
   - Time-series chart showing sales data over different periods

3. **Recent Shipments Table**
   - Table showing recent shipment details with pagination

4. **Dispatch History**
   - Table showing dispatch history with filtering and pagination
   - Monthly history chart showing completion percentages

5. **Dispatcher Details**
   - Personal information, business details, and performance metrics
   - List of dispatchers for selection

## Need Help?

Refer to the detailed API documentation in `DASHBOARD_API_DOCUMENTATION.md` for more information about each endpoint, request parameters, and response formats.