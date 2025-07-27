# DALScooter Booking Module

This module handles all booking-related functionality for the DALScooter e-scooter rental platform.

## Architecture

### DynamoDB Table: `DALScooterBookings`

**Primary Key:**
- `bookingId` (String) - Unique identifier for each booking

**Attributes:**
- `userId` (String) - Cognito user ID
- `userEmail` (String) - User's email address
- `bikeId` (String) - ID of the booked vehicle
- `startDate` (String) - ISO 8601 formatted start date/time
- `endDate` (String) - ISO 8601 formatted end date/time
- `duration` (Number) - Duration in hours
- `status` (String) - Booking status (active, cancelled, completed)
- `notes` (String) - Optional booking notes
- `createdAt` (String) - ISO 8601 formatted creation timestamp
- `updatedAt` (String) - ISO 8601 formatted last update timestamp
- `bikeModel` (String) - Vehicle model name
- `bikeType` (String) - Vehicle type (eBike, Gyroscooter, Segway)
- `bookingDate` (String) - Date portion for GSI queries

**Global Secondary Indexes:**
1. **UserBookingsIndex**
   - Hash Key: `userId`
   - Range Key: `bookingDate`
   - Purpose: Query bookings by user

2. **BikeBookingsIndex**
   - Hash Key: `bikeId`
   - Range Key: `bookingDate`
   - Purpose: Query bookings by vehicle for availability checks

## Lambda Functions

### 1. Create Booking Lambda (`create_booking_lambda.py`)
**Endpoint:** `POST /bookings`

**Functionality:**
- Creates new bookings with validation
- Checks vehicle availability
- Prevents double-booking conflicts
- Validates date ranges and business rules

**Request Body:**
```json
{
  "bikeId": "bike-123",
  "startDate": "2024-01-15T10:00:00Z",
  "endDate": "2024-01-15T12:00:00Z",
  "duration": 2,
  "notes": "Optional booking notes"
}
```

**Response:**
```json
{
  "message": "Booking created successfully",
  "bookingId": "uuid-123",
  "booking": {
    "bookingId": "uuid-123",
    "userId": "user-123",
    "userEmail": "user@example.com",
    "bikeId": "bike-123",
    "startDate": "2024-01-15T10:00:00Z",
    "endDate": "2024-01-15T12:00:00Z",
    "duration": 2,
    "status": "active",
    "notes": "Optional booking notes",
    "createdAt": "2024-01-15T09:00:00Z",
    "bikeModel": "Xiaomi M365",
    "bikeType": "eBike"
  }
}
```

### 2. Get Bookings Lambda (`get_bookings_lambda.py`)
**Endpoint:** `GET /bookings`

**Functionality:**
- Retrieves user's bookings with optional filtering
- Admin users can view all bookings
- Supports status and date filtering

**Query Parameters:**
- `status` (optional) - Filter by booking status
- `date` (optional) - Filter by booking date (YYYY-MM-DD)
- `limit` (optional) - Maximum number of results (default: 50)

**Response:**
```json
{
  "bookings": [
    {
      "bookingId": "uuid-123",
      "userId": "user-123",
      "userEmail": "user@example.com",
      "bikeId": "bike-123",
      "startDate": "2024-01-15T10:00:00Z",
      "endDate": "2024-01-15T12:00:00Z",
      "duration": 2,
      "status": "active",
      "notes": "Optional booking notes",
      "createdAt": "2024-01-15T09:00:00Z",
      "updatedAt": "2024-01-15T09:00:00Z",
      "bikeModel": "Xiaomi M365",
      "bikeType": "eBike"
    }
  ],
  "count": 1,
  "userEmail": "user@example.com",
  "isAdmin": false
}
```

### 3. Update Booking Lambda (`update_booking_lambda.py`)
**Endpoint:** `PUT /bookings/{bookingId}`

**Functionality:**
- Updates existing bookings
- Validates user ownership (unless admin)
- Prevents updates to cancelled/completed bookings
- Validates date changes

**Request Body:**
```json
{
  "startDate": "2024-01-15T11:00:00Z",
  "endDate": "2024-01-15T13:00:00Z",
  "duration": 2,
  "notes": "Updated notes",
  "status": "active"
}
```

**Response:**
```json
{
  "message": "Booking updated successfully",
  "bookingId": "uuid-123",
  "updatedFields": ["startDate", "endDate", "duration", "notes"],
  "updatedAt": "2024-01-15T09:30:00Z"
}
```

### 4. Cancel Booking Lambda (`cancel_booking_lambda.py`)
**Endpoint:** `DELETE /bookings/{bookingId}`

**Functionality:**
- Cancels active bookings
- Validates user ownership (unless admin)
- Prevents cancellation of started bookings
- Updates booking status to 'cancelled'

**Response:**
```json
{
  "message": "Booking cancelled successfully",
  "bookingId": "uuid-123",
  "cancelledAt": "2024-01-15T09:30:00Z",
  "booking": {
    "bookingId": "uuid-123",
    "userId": "user-123",
    "userEmail": "user@example.com",
    "bikeId": "bike-123",
    "startDate": "2024-01-15T10:00:00Z",
    "endDate": "2024-01-15T12:00:00Z",
    "duration": 2,
    "status": "cancelled",
    "notes": "Optional booking notes",
    "createdAt": "2024-01-15T09:00:00Z",
    "updatedAt": "2024-01-15T09:30:00Z",
    "bikeModel": "Xiaomi M365",
    "bikeType": "eBike"
  }
}
```

### 5. Get Booking Details Lambda (`get_booking_details_lambda.py`)
**Endpoint:** `GET /bookings/{bookingId}`

**Functionality:**
- Retrieves detailed information about a specific booking
- Includes calculated fields like time until start and remaining time
- Validates user ownership (unless admin)

**Response:**
```json
{
  "booking": {
    "bookingId": "uuid-123",
    "userId": "user-123",
    "userEmail": "user@example.com",
    "bikeId": "bike-123",
    "startDate": "2024-01-15T10:00:00Z",
    "endDate": "2024-01-15T12:00:00Z",
    "duration": 2,
    "status": "active",
    "notes": "Optional booking notes",
    "createdAt": "2024-01-15T09:00:00Z",
    "updatedAt": "2024-01-15T09:00:00Z",
    "bikeModel": "Xiaomi M365",
    "bikeType": "eBike",
    "timeUntilStart": {
      "days": 0,
      "hours": 1,
      "minutes": 30
    },
    "bookingState": "upcoming",
    "remainingTime": null
  },
  "userEmail": "user@example.com",
  "isAdmin": false
}
```

## Business Rules

### Booking Creation
1. **Vehicle Availability**: Vehicle must exist and be marked as 'available'
2. **Conflict Prevention**: No overlapping bookings for the same vehicle
3. **Date Validation**: Start date must be in the future
4. **Duration Validation**: End date must be after start date

### Booking Updates
1. **Ownership**: Users can only update their own bookings (unless admin)
2. **Status Restrictions**: Cannot update cancelled or completed bookings
3. **Date Validation**: Updated start date cannot be in the past

### Booking Cancellation
1. **Ownership**: Users can only cancel their own bookings (unless admin)
2. **Status Restrictions**: Cannot cancel already cancelled or completed bookings
3. **Time Restrictions**: Cannot cancel bookings that have already started

### Access Control
1. **User Access**: Regular users can only access their own bookings
2. **Admin Access**: Users in 'BikeFranchise' group can access all bookings
3. **Authentication**: All endpoints require valid Cognito JWT tokens

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created (for new bookings)
- `400` - Bad Request (validation errors)
- `403` - Forbidden (access denied)
- `404` - Not Found (booking not found)
- `409` - Conflict (booking conflicts)
- `500` - Internal Server Error

## Deployment

The booking module is deployed as part of the main Terraform configuration. To deploy:

1. Navigate to `backend/terraform/`
2. Run `./deploy.ps1` (Windows) or equivalent deployment script
3. The module will be deployed with all Lambda functions and API Gateway endpoints

## Environment Variables

The following environment variables are available in the frontend:
- `VITE_BOOKING_API` - Booking API Gateway endpoint URL 