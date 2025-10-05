# DALScooter 🛴

**DALScooter** is a serverless, full-stack e‑scooter platform built to manage rides, locations, and operations seamlessly. Built with modern cloud infrastructure and event-driven patterns, this project demonstrates how to design, deploy, and maintain scalable backend and frontend systems that integrate with real-world device/vehicle fleets.

---

## Table of Contents

1. [Features](#features)  
2. [Architecture & Tech Stack](#architecture--tech-stack)  
3. [Getting Started](#getting-started)  
   1. [Prerequisites](#prerequisites)  
   2. [Deploying the Backend](#deploying-the-backend)  
   3. [Running the Frontend](#running-the-frontend)  
4. [Core Concepts & Design Decisions](#core-concepts--design-decisions)  
5. [API Endpoints & Data Model](#api-endpoints--data-model)  
6. [Authentication & Security](#authentication--security)  
7. [Event Flow & Messaging](#event-flow--messaging)  
8. [Testing & Monitoring](#testing--monitoring)  
9. [Future Enhancements](#future-enhancements)   
10. [License](#license)  

---

## Features

- Real-time scooter ride management: start, stop, track rides  
- Serverless backend with Lambda functions for scalability  
- Event-driven architecture using messaging (e.g. SNS/SQS)  
- Terraform-based infrastructure provisioning  
- Identity and authentication using AWS Cognito  
- Role-based access (e.g. user, admin)  
- Fleet status updates (location, battery, maintenance)  
- Admin dashboard / operator UI for scooter management  
- Secure REST APIs consumed by frontend  

---

## Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| Infrastructure & Cloud | AWS (Lambda, DynamoDB, API Gateway, SQS/SNS, Cognito, IAM) |
| Infrastructure as Code | Terraform |
| Backend / Business Logic | Node.js / TypeScript (or Python, depending on code), Lambda handlers |
| Frontend | React (or your chosen frontend framework) |
| Messaging & Events | AWS SNS / SQS |
| Storage | DynamoDB |
| Authentication / Authorization | AWS Cognito, JWT |
| Deployment / CI-CD | (You may use Amplify, or GitHub Actions / AWS CodePipeline) |

This architecture ensures that your backend scales automatically, isolates individual components for easier maintenance, and minimizes operational overhead.

---

## Getting Started

### Prerequisites

Before you begin:

- AWS account with permissions to deploy Lambda, Cognito, API Gateway, SQS/SNS, DynamoDB  
- Terraform installed  
- Node.js (>= 16.x) and npm / yarn  
- (Optional) AWS CLI configured  

### Deploying the Backend

1. Clone the repository:

   ```bash
   git clone https://github.com/shraymoza/DALScooter.git
   cd DALScooter/backend
   ```

2. Configure your AWS environment variables and credentials.

3. Deploy infrastructure:

   ```bash
   terraform init
   terraform apply
   ```

   This will create Cognito user pool, Lambda functions, API gateway endpoints, DynamoDB tables, and messaging resources.

4. Build and deploy backend code (packaging and connecting to created infra):

   ```bash
   npm install
   npm run build
   npm run deploy
   ```

### Running the Frontend

1. Move to frontend directory:

   ```bash
   cd ../frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure your frontend `.env` or config to point to backend APIs and Cognito IDs.

4. Start development server:

   ```bash
   npm start
   ```

5. Access the UI, login, and test dashboards and rides flows.

---

## Core Concepts & Design Decisions

- **Serverless-first approach**: Choosing Lambda + API Gateway eliminates the need to manage servers and allows you to scale automatically.  
- **Event-driven operations**: Use of SNS/SQS decouples operations (e.g., status updates, notifications) to allow eventual consistency.  
- **Infrastructure as code (IaC)**: Terraform ensures that the entire stack is versioned and reproducible.  
- **Minimal dependencies**: Keep Lambdas small and single-purposed to reduce blast radius and simplify debugging.  
- **Security by design**: Use Cognito for user authentication and fine-grained IAM permissions to limit access.  
- **Loose coupling**: Frontend & backend communicate over HTTP / JWT; backend services communicate via events.  

---

## API Endpoints & Data Model

Here’s a sample of HTTP endpoints and how data is structured:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/signup` | POST | Register a new user |
| `/auth/login` | POST | Obtain JWT tokens |
| `/rides/start` | POST | Start a new ride (specify scooter ID, user ID) |
| `/rides/stop` | POST | End a ride and record path/duration |
| `/scooters/status` | GET | Retrieve fleet status, location, battery |
| `/admin/scooters` | POST / PUT / DELETE | Admin-only CRUD operations on scooters |

**Data Model (simplified):**

```text
User {
  id: string
  username
  email
  role: user | admin
  createdAt, updatedAt
}

Scooter {
  id: string
  latitude, longitude
  batteryLevel
  status: available | in_use | maintenance
  lastUpdated
}

Ride {
  rideId: string
  userId, scooterId
  startTime, endTime
  path: [ { lat, lng, timestamp } ]
  cost, distance
}
```

---

## Authentication & Security

- Users sign up / login via **Cognito**, obtaining JWT tokens (access, id, refresh).  
- API Gateway enforces token validation and scopes/roles.  
- Backend Lambdas have least privilege IAM policies restricting access to required DynamoDB tables or messaging topics.  
- Sensitive operations (e.g., admin endpoints) are role-restricted.  
- All communication is over HTTPS.  

---

## Event Flow & Messaging

1. When a ride starts, the frontend calls `/rides/start` → Lambda writes initial ride data to DynamoDB and publishes an event to SNS (e.g. `RideStarted`).  
2. A downstream Lambda subscribed to `RideStarted` may trigger auxiliary actions (e.g. send notifications, update fleet metrics).  
3. Periodically, status updates from scooters (location, battery) are sent to a status topic; Lambdas process into the data model.  
4. At ride end, `/rides/stop` writes final data and triggers event `RideEnded` for cost calculation, metrics, cleanup.  

This decoupled architecture enables you to add new features (e.g. analytics, billing) by subscribing to events without modifying core ride logic.

---

## Testing & Monitoring

- Use **unit tests** (e.g. Jest, Mocha for JavaScript / TypeScript; PyTest for Python) to validate business logic in isolation.  
- **Integration tests** to verify end-to-end flow between Lambdas, API Gateway, and database.  
- (Optional) Use AWS CloudWatch and alarms to monitor Lambda errors, latency, and function usage.  
- Logging and error trapping within Lambdas for traceability.  

---

## Future Enhancements

Here are ideas you might consider extending:

- **Real-time WebSocket tracking**: stream live scooter movement to users  
- **Pricing algorithm**: dynamic pricing by time, location, usage  
- **Predictive maintenance**: analyze battery cycles and signal service needs  
- **User analytics dashboard**  
- **Offline ride support**  
- **Payment integration / billing microservice**  
- **Rate limiting, caching, and throughput optimizations**  
- **Support for multi-city and zoning restrictions**

---

## License

Distributed under the MIT License. See `LICENSE` for details.  

---

Thank you for checking out **DALScooter** — I hope this code serves as a clear example of building modern, scalable, serverless applications. Feel free to explore, give feedback, or extend the project.
