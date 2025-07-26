# DALScooter Booking Module

This module provides a complete booking management system for the DALScooter platform, allowing users to reserve electric vehicles with real-time availability checking and conflict resolution.

## Features

### 🚀 Core Functionality
- **Real-time Availability Checking**: Check vehicle availability for specific dates and time slots
- **Conflict Resolution**: Prevent double bookings with intelligent conflict detection
- **Booking Management**: Create, view, and cancel bookings
- **Cost Calculation**: Automatic cost calculation based on duration and hourly rates
- **Booking References**: Unique booking reference codes (BK-XXXXXX format)
- **Access Codes**: Vehicle access codes for user convenience

### 🔐 Security & Validation
- **JWT Authentication**: Secure API access with Cognito JWT tokens
- **Input Validation**: Comprehensive validation for dates, times, and required fields
- **User Authorization**: Users can only access their own bookings
- **Conflict Prevention**: Prevents overlapping bookings for the same vehicle

### 📊 Data Management
- **DynamoDB Integration**: Scalable NoSQL database for booking storage
- **Global Secondary Indexes**: Optimized queries for different access patterns
- **Audit Trail**: Complete booking history with timestamps

## Architecture

### Backend Components

#### DynamoDB Table: `DALScooterBookings`
- **Primary Key**: `bookingId` (String)
- **Sort Key**: `userId` (String)
- **GSI 1**: `BikeIdIndex` - Query bookings by vehicle
- **GSI 2**: `BookingDateIndex` - Query bookings by date

#### Lambda Functions

1. **Create Booking Lambda** (`create_booking_lambda.py`)
   - Creates new bookings with conflict checking
   - Generates unique booking references
   - Calculates total cost
   - Validates all input parameters

2. **Get User Bookings Lambda** (`get_user_bookings_lambda.py`)
   - Retrieves user's booking history
   - Supports filtering by status and date
   - Returns formatted booking data

3. **Cancel Booking Lambda** (`cancel_booking_lambda.py`)
   - Cancels confirmed bookings
   - Validates booking ownership and status
   - Prevents cancellation of past bookings

4. **Get Available Vehicles Lambda** (`get_available_vehicles_lambda.py`)
   - Returns available vehicles for a time slot
   - Checks for booking conflicts
   - Supports filtering by vehicle type

#### API Gateway
- **HTTP API**: RESTful endpoints with CORS support
- **Authentication**: Cognito JWT integration
- **Rate Limiting**: Built-in API Gateway protection

## API Endpoints

### POST /bookings
Creates a new booking.

**Request Body:**
```json
{
  "bikeId": "vehicle-uuid",
  "bookingDate": "2024-01-15",
  "startTime": "10:00",
  "endTime": "12:00",
  "pickupLocation": "Halifax Downtown"
}
```

**Response:**
```json
{
  "message": "Booking created successfully",
  "bookingReference": "BK-A1B2C3",
  "bookingId": "booking-uuid",
  "totalCost": 24.00,
  "accessCode": "1234",
  "pickupLocation": "Halifax Downtown"
}
```

### GET /bookings
Retrieves user's bookings with optional filtering.

**Query Parameters:**
- `status` (optional): Filter by booking status
- `date` (optional): Filter by booking date

**Response:**
```json
{
  "bookings": [
    {
      "bookingId": "booking-uuid",
      "bookingReference": "BK-A1B2C3",
      "bikeId": "vehicle-uuid",
      "bookingDate": "2024-01-15",
      "startTime": "10:00",
      "endTime": "12:00",
      "pickupLocation": "Halifax Downtown",
      "totalCost": 24.00,
      "hourlyRate": 12.00,
      "vehicleType": "eBike",
      "vehicleModel": "City Cruiser",
      "accessCode": "1234",
      "status": "confirmed",
      "createdAt": "2024-01-10T10:00:00Z",
      "updatedAt": "2024-01-10T10:00:00Z"
    }
  ],
  "count": 1
}
```

### DELETE /bookings/{bookingId}
Cancels a booking.

**Response:**
```json
{
  "message": "Booking cancelled successfully",
  "bookingReference": "BK-A1B2C3"
}
```

### GET /available-vehicles
Gets available vehicles for a time slot.

**Query Parameters:**
- `date` (required): Booking date (YYYY-MM-DD)
- `startTime` (optional): Start time (HH:MM)
- `endTime` (optional): End time (HH:MM)
- `type` (optional): Vehicle type filter

**Response:**
```json
{
  "vehicles": [
    {
      "bikeId": "vehicle-uuid",
      "type": "eBike",
      "model": "City Cruiser",
      "accessCode": "1234",
      "batteryLife": "85%",
      "hourlyRate": 12.00,
      "discount": "10%",
      "features": ["GPS", "LED Lights"]
    }
  ],
  "count": 1,
  "date": "2024-01-15",
  "startTime": "10:00",
  "endTime": "12:00"
}
```

## Database Schema

### Bookings Table Structure
```json
{
  "bookingId": "string (UUID)",
  "userId": "string (Cognito User ID)",
  "userEmail": "string",
  "bikeId": "string (Vehicle UUID)",
  "bookingReference": "string (BK-XXXXXX)",
  "bookingDate": "string (YYYY-MM-DD)",
  "startTime": "string (HH:MM)",
  "endTime": "string (HH:MM)",
  "pickupLocation": "string",
  "totalCost": "number (Decimal)",
  "hourlyRate": "number (Decimal)",
  "vehicleType": "string",
  "vehicleModel": "string",
  "accessCode": "string",
  "status": "string (confirmed/cancelled/completed)",
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)"
}
```

## Deployment

### Prerequisites
- AWS CLI configured
- Terraform installed
- PowerShell (for Windows deployment)

### Deployment Steps

1. **Package Lambda Functions:**
   ```powershell
   .\backend\booking-module\deploy.ps1
   ```

2. **Deploy Infrastructure:**
   ```bash
   cd backend/terraform
   terraform init
   terraform plan
   terraform apply
   ```

3. **Update Frontend Environment:**
   Add the booking API endpoint to your frontend environment variables:
   ```
   VITE_BOOKING_API=https://your-booking-api-gateway-url.amazonaws.com/prod
   ```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "error": "Missing required fields"
}
```

**404 Not Found:**
```json
{
  "error": "Vehicle not found"
}
```

**409 Conflict:**
```json
{
  "error": "Time slot conflicts with existing booking BK-A1B2C3"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

## Security Considerations

- **JWT Validation**: All endpoints require valid Cognito JWT tokens
- **User Isolation**: Users can only access their own bookings
- **Input Sanitization**: All inputs are validated and sanitized
- **Rate Limiting**: API Gateway provides built-in rate limiting
- **CORS Configuration**: Proper CORS headers for frontend integration

## Monitoring & Logging

- **CloudWatch Logs**: All Lambda functions log to CloudWatch
- **Error Tracking**: Comprehensive error logging with stack traces
- **Performance Monitoring**: Lambda execution time and memory usage tracking
- **API Gateway Metrics**: Request/response metrics and error rates

## Future Enhancements

- **Recurring Bookings**: Support for weekly/monthly recurring reservations
- **Group Bookings**: Multiple vehicle bookings in a single transaction
- **Payment Integration**: Direct payment processing
- **SMS Notifications**: Booking confirmations and reminders
- **Analytics Dashboard**: Booking trends and revenue analytics
- **Mobile App**: Native mobile application support 