# Glister Backend

Backend API for Glister - Door Handles & Bathroom Accessories

## Features

- ✅ Product Management (CRUD)
- ✅ Category Management
- ✅ Materials & Finishes Management
- ✅ Product Configurations with Dynamic Pricing
- ✅ Shopping Cart Management
- ✅ **JWT Authentication with Role-Based Access Control**
- ✅ **Password Hashing & Security**
- ✅ **Forgot Password / Reset Password**
- ✅ **Admin & Customer User Management**
- ✅ Image Upload with Cloudinary

## Authentication System

The backend now includes a comprehensive authentication system with:

- User Registration & Login
- JWT Token-based Authentication
- Password Hashing (bcryptjs)
- Forgot Password / Reset Password via Email
- Role-based Access Control (Admin & Customer)
- Protected Routes with Middleware
- User Profile Management

📖 **See [AUTH_DOCUMENTATION.md](./AUTH_DOCUMENTATION.md) for complete authentication API documentation.**

## Environment Variables Setup

### For Vercel Deployment

You **MUST** add the following environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your backend project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend-domain.com
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@glister.com
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Replace the placeholders with your actual values.

### For Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your actual values:
   ```
   # Server
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/glister
   
   # JWT
   JWT_SECRET=your_super_secret_jwt_key_change_in_production
   JWT_EXPIRE=7d
   
   # Frontend
   FRONTEND_URL=http://localhost:3000
   
   # Email (for password reset)
   EMAIL_SERVICE=gmail
   EMAIL_USERNAME=your_email@gmail.com
   EMAIL_PASSWORD=your_gmail_app_password
   EMAIL_FROM=noreply@glister.com
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

## Running Locally

```bash
# Install dependencies
npm install

# Create admin user (first time only)
npm run seed:admin

# Seed data (optional)
npm run seed:all

# Start development server
npm run dev
```

### Creating Admin User

After setting up the environment variables, create an admin user:

```bash
npm run seed:admin
```

This will create an admin user with:
- Email: `admin@glister.com`
- Password: `admin123`
- Role: `admin`

⚠️ **Important:** Change the password after first login!

## API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)
- `PUT /api/auth/update-details` - Update user details (Protected)
- `PUT /api/auth/update-password` - Update password (Protected)
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password
- `POST /api/auth/logout` - Logout user (Protected)
- `GET /api/auth/users` - Get all users (Admin only)
- `GET /api/auth/users/:id` - Get user by ID (Admin only)
- `PUT /api/auth/users/:id` - Update user (Admin only)
- `DELETE /api/auth/users/:id` - Delete user (Admin only)

### Other Routes

- `/api/categories` - Category management
- `/api/products` - Product management
- `/api/finishes` - Finishes management
- `/api/materials` - Materials management
- `/api/configurations` - Product configurations
- `/api/cart` - Shopping cart

See [AUTH_DOCUMENTATION.md](./AUTH_DOCUMENTATION.md) for detailed API documentation.

## Deploying to Vercel

1. Make sure you've added the `MONGODB_URI` environment variable in Vercel settings
2. Push your code to GitHub
3. Vercel will automatically deploy

## Important Notes for Serverless

- The database connection is now optimized for serverless environments
- Connections are cached and reused across function invocations
- Buffering is disabled to prevent timeout errors
- Connection timeout is set to 5 seconds for faster error detection

## Troubleshooting

If you get "buffering timed out" errors:
1. Verify your `MONGODB_URI` environment variable is set in Vercel
2. Ensure your MongoDB Atlas cluster allows connections from Vercel IPs (0.0.0.0/0)
3. Check your MongoDB Atlas user has proper permissions
4. Verify the database name in your connection string is correct

