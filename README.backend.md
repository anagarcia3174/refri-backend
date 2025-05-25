# Refri Backend

This is the backend service for Refri, a cross-platform mobile application that helps health-conscious individuals manage their kitchen inventory, discover macro-friendly recipes, and connect with like-minded people in a social media environment.

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Email Service:** AWS SES (Simple Email Service)
- **Logging:** Winston

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── middleware/     # Custom middleware
├── models/         # Mongoose models
├── routes/         # API routes
├── services/       # Business logic
├── templates/      # Email templates
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── server.ts       # Application entry point
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- AWS SES credentials (for email functionality)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   NODE_ENV=your-node-env
   MONGO_URL=your-mongo-url
   ACCESS_TOKEN_SECRET=your-jwt-access-token-secret
   REFRESH_TOKEN_SECRET=your-jwt-refresh-token-secret
   EMAIL_VERIFICATION_TOKEN_SECRET=your-email-verification-token-secret
   AWS_ACCESS_KEY_ID=your-aws-access-key-id
   AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
   AWS_REGION=your-aws-region
   EMAIL_FROM=your-from-email
   VERIFICATION_LINK=your-verification-url
   ```

## Running the Application

Development mode:
```bash
npm start
```

## API Features

- User authentication and authorization
- Recipe management
- Kitchen inventory tracking
- Social features (following, likes, comments)
- Email notifications
- Rate limiting and security measures

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation

## Development

The project uses:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Nodemon for development auto-reload

## Dependencies

### Production
- express: Web framework
- mongoose: MongoDB ODM
- jsonwebtoken: JWT authentication
- bcrypt: Password hashing
- cors: Cross-origin resource sharing
- dotenv: Environment variables
- winston: Logging
- aws-sdk: AWS services integration
- nodemailer: Email functionality

### Development
- typescript: TypeScript support
- nodemon: Development server
- eslint: Code linting
- prettier: Code formatting
- ts-node: TypeScript execution
