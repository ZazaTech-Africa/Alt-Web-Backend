# Dashboard API Documentation

This document provides comprehensive information about the Dashboard API endpoints, their request/response formats, and integration guidelines for frontend developers.

## Base URL

All API endpoints are prefixed with `/api/dashboard`

## Authentication

All dashboard endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### 1. Get Dashboard Statistics

**Endpoint:** `GET /api/dashboard/stats`

**Description:** Retrieves overall dashboard statistics including dispatch counts and revenue information.

**Response Schema:**

```json
{
  "success": true,
  "stats": {
    "totalDispatch": {
      "count": 19250,
      "percentChange": 50
    },
    "activeDispatch": {
      "count": 113,
      "percentChange": 100
    },
    "pendingDispatch": {
      "count": 210,
      "percentChange": 90
    },
    "successfulDispatch": {
      "count": 10790,
      "percentChange": 150
    },
    "cancelledDispatchCount": 45,
    "successRate": 56.05,
    "totalRevenue": 1250000
  }
}
```

### 2. Get Dispatch Sales Statistics

**Endpoint:** `GET /api/dashboard/dispatch-sales`

**Query Parameters:**
- `period` (optional): Time period for sales data. Options: "24hours", "7days", "30days", "12months". Default: "7days"

**Description:** Retrieves sales statistics and order trends for the specified time period.

**Response Schema:**

```json
{
  "success": true,
  "salesData": [
    {
      "_id": 1,
      "totalSales": 25000,
      "orderCount": 15
    },
    // More data points based on the period
  ],
  "orderTrends": [
    {
      "_id": 1,
      "statuses": [
        {
          "status": "delivered",
          "count": 10
        },
        {
          "status": "pending",
          "count": 5
        }
        // Other statuses
      ]
    },
    // More data points
  ],
  "period": "7days"
}
```

### 3. Get Recent Shipments

**Endpoint:** `GET /api/dashboard/recent-shipments`

**Query Parameters:**
- `limit` (optional): Number of shipments to return. Default: 10
- `page` (optional): Page number for pagination. Default: 1

**Description:** Retrieves recent shipments with pagination.

**Response Schema:**

```json
{
  "success": true,
  "shipments": [
    {
      "id": "60d21b4667d0d8992e610c85",
      "status": "Picked",
      "productName": "LG TV",
      "min": "5 mins ago",
      "pickUp": "N0 7 Agip Road, Port Harcourt.",
      "dropOff": "N0 20 Agip Road, Port Harcourt.",
      "customerName": "Victor John",
      "deliveryPrice": "N5,500",
      "profileName": "Dan Jane",
      "dispatcherName": "Victor John",
      "driverName": "Dan Jane",
      "driverImage": "https://example.com/image.jpg",
      "driverRating": 4.5,
      "itemsNo": 2,
      "orderDate": "2023-06-15T10:30:00Z",
      "dispatchDate": "2023-06-15T11:30:00Z",
      "dispatchLocation": "Port Harcourt",
      "quantity": 1,
      "dispatchStatus": "delivered",
      "orderNumber": "ORD-12345",
      "trackingNumber": "TRK-12345",
      "customerRating": 5,
      "estimatedDeliveryTime": "2023-06-15T13:30:00Z",
      "actualDeliveryTime": "2023-06-15T13:15:00Z"
    },
    // More shipments
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalShipments": 45,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 4. Get Dispatch History

**Endpoint:** `GET /api/dashboard/history`

**Query Parameters:**
- `limit` (optional): Number of orders to return. Default: 20
- `page` (optional): Page number for pagination. Default: 1
- `status` (optional): Filter by order status
- `startDate` (optional): Filter by start date (ISO format)
- `endDate` (optional): Filter by end date (ISO format)
- `search` (optional): Search term for filtering orders

**Description:** Retrieves dispatch history with filtering and pagination.

**Response Schema:**

```json
{
  "success": true,
  "orders": [
    {
      "id": "60d21b4667d0d8992e610c85",
      "status": "Picked",
      "productName": "LG TV",
      "min": "5 mins ago",
      "pickUp": "N0 7 Agip Road, Port Harcourt.",
      "dropOff": "N0 20 Agip Road, Port Harcourt.",
      "customerName": "Victor John",
      "deliveryPrice": "N5,500",
      "profileName": "Dan Jane",
      "orderNumber": "ORD-12345",
      "trackingNumber": "TRK-12345",
      "itemsCount": 2,
      "quantity": 1,
      "vehicleType": "van",
      "estimatedCost": 5500,
      "actualCost": 5500,
      "orderDate": "2023-06-15T10:30:00Z",
      "requestedDeliveryDate": "2023-06-15T15:30:00Z",
      "actualDispatchDate": "2023-06-15T11:30:00Z",
      "actualDeliveryDate": "2023-06-15T13:15:00Z"
    },
    // More orders
  ],
  "history": [
    { "month": "January", "percentage": 100 },
    { "month": "Febuary", "percentage": 80 },
    { "month": "March", "percentage": 95 },
    { "month": "April", "percentage": 50 }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalOrders": 95,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 5. Get Dispatcher Details

**Endpoint:** `GET /api/dashboard/dispatcher-details`

**Description:** Retrieves dispatcher personal information, business details, and performance metrics.

**Response Schema:**

```json
{
  "success": true,
  "dispatchers": [
    {
      "id": 1,
      "name": "Peter Akpon",
      "image": "https://randomuser.me/api/portraits/men/1.jpg"
    },
    {
      "id": 2,
      "name": "John West",
      "image": "https://randomuser.me/api/portraits/men/2.jpg"
    },
    // More dispatchers
  ],
  "dispatcher": {
    "personalInfo": {
      "fullName": "John Doe",
      "email": "john@example.com",
      "profileImage": "https://example.com/profile.jpg",
      "about": "Experienced dispatcher with 5 years in logistics",
      "memberSince": "2020-01-15T10:30:00Z",
      "lastLogin": "2023-06-20T08:45:00Z"
    },
    "businessInfo": {
      "businessName": "Fast Logistics Ltd",
      "businessEmail": "info@fastlogistics.com",
      "businessAddress": "123 Main Street, Port Harcourt",
      "businessHotline": "+2348012345678",
      "alternativePhoneNumber": "+2348087654321",
      "cacRegistrationNumber": "RC123456",
      "isVerified": true,
      "verificationStatus": "verified"
    },
    "performanceMetrics": {
      "totalOrders": 250,
      "completedOrders": 230,
      "cancelledOrders": 5,
      "completionRate": 92.0,
      "averageDeliveryDays": 1.5,
      "businessRating": 4.8
    }
  }
}
```

## Data Models

### Order Schema

```javascript
const orderSchema = {
  user: ObjectId,                // Reference to User model
  business: ObjectId,            // Reference to Business model
  orderNumber: String,           // Unique order number
  itemsCount: Number,            // Number of items in the order
  description: String,           // Order description
  quantity: Number,              // Order quantity
  pickupLocation: {              // Pickup location details
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    contactPerson: String,
    contactPhone: String
  },
  deliveryLocation: {            // Delivery location details
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    contactPerson: String,
    contactPhone: String
  },
  orderDate: Date,               // Date when order was placed
  requestedDeliveryDate: Date,   // Requested delivery date
  actualDispatchDate: Date,      // Actual dispatch date
  actualDeliveryDate: Date,      // Actual delivery date
  assignedDriver: ObjectId,      // Reference to Driver model
  vehicleType: String,           // Type of vehicle (car, bike, van)
  status: String,                // Order status (pending, assigned, in_transit, delivered, cancelled)
  estimatedCost: Number,         // Estimated cost of delivery
  actualCost: Number,            // Actual cost of delivery
  trackingNumber: String,        // Unique tracking number
  notes: String,                 // Additional notes
  statusHistory: [{              // History of status changes
    status: String,
    timestamp: Date,
    notes: String
  }]
}
```

## Frontend Integration Guidelines

### Dashboard Statistics Integration

1. Use the `/api/dashboard/stats` endpoint to populate the main dashboard statistics cards.
2. Display the count and percentage change for each dispatch type (total, active, pending, successful).
3. Use the percentage change values to show trend indicators (up/down arrows).

### Dispatch Sales Chart Integration

1. Use the `/api/dashboard/dispatch-sales` endpoint to populate sales charts.
2. Implement period selection (24 hours, 7 days, 30 days, 12 months) to allow users to view different time ranges.
3. Create two charts:
   - Sales chart showing total sales amount over time
   - Order trends chart showing order counts by status over time

### Recent Shipments Table Integration

1. Use the `/api/dashboard/recent-shipments` endpoint to populate the recent shipments table.
2. Implement pagination controls using the pagination data from the response.
3. Display key shipment information: status, product name, time ago, pickup/dropoff locations, customer name, delivery price, and driver name.

### Dispatch History Integration

1. Use the `/api/dashboard/history` endpoint to populate the dispatch history table and chart.
2. Implement filters for status, date range, and search functionality.
3. Display the monthly history data in a chart showing completion percentages by month.
4. Implement pagination controls for the orders table.

### Dispatcher Details Integration

1. Use the `/api/dashboard/dispatcher-details` endpoint to display dispatcher information.
2. Show personal information, business details, and performance metrics in separate sections.
3. Display the list of dispatchers for selection.

## Error Handling

All API endpoints return error responses in the following format:

```json
{
  "success": false,
  "message": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad request (invalid parameters)
- 401: Unauthorized (missing or invalid token)
- 404: Resource not found
- 500: Server error

## Best Practices

1. Implement proper error handling for API requests.
2. Use loading states while fetching data from the API.
3. Implement caching strategies to reduce API calls for frequently accessed data.
4. Use optimistic UI updates for better user experience.
5. Implement proper date formatting for consistent display across the application.