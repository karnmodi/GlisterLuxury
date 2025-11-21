# Email Flow Documentation

## Email Addresses (5 total)

All emails now use the `@glisterluxury.com` domain:

1. **sales@glisterluxury.com** - Business/sales inquiries
2. **enquiries@glisterluxury.com** - General inquiries and contact form submissions
3. **orders@glisterluxury.com** - Order-related customer communications
4. **noreply@glisterluxury.com** - System emails (password reset, etc.)
5. **admin@glisterluxury.com** - Administrative purposes (new)

## Outgoing Email Flow

### Customer-Facing Emails

#### Order Confirmations
- **From:** `orders@glisterluxury.com`
- **To:** Customer email address
- **Trigger:** When an order is placed (guest or authenticated user)
- **Subject:** `Order Confirmation #[orderNumber] - Glister Luxury`
- **Content:** Order details, items, pricing, delivery information
- **Logo:** Uses absolute URL from `FRONTEND_URL` environment variable

#### Order Updates
- **From:** `orders@glisterluxury.com`
- **To:** Customer email address
- **Trigger:** When admin adds a message to an order
- **Subject:** `Order Update #[orderNumber] - Glister Luxury`
- **Content:** Admin message, order status, order details
- **Logo:** Uses absolute URL from `FRONTEND_URL` environment variable

#### Contact Form Confirmations
- **From:** `enquiries@glisterluxury.com`
- **To:** Customer email address (from contact form)
- **Trigger:** When a contact inquiry is submitted
- **Subject:** `Thank You for Your Inquiry - Glister Luxury`
- **Content:** Confirmation that inquiry was received
- **Note:** Only sent if auto-reply is not enabled for enquiries@glisterluxury.com

#### Password Reset Emails
- **From:** `noreply@glisterluxury.com`
- **To:** User email address
- **Trigger:** When user requests password reset
- **Subject:** `Password Reset Request - Glister Luxury`
- **Content:** Password reset link

### Admin Notifications

All admin notifications are sent to **both**:
1. Primary admin email: `process.env.ADMIN_EMAIL || process.env.EMAIL_USERNAME`
2. Secondary admin email: `londonglister@gmail.com`

#### New Order Notifications
- **From:** `enquiries@glisterluxury.com`
- **To:** `[ADMIN_EMAIL]` + `londonglister@gmail.com`
- **Trigger:** When a new order is placed
- **Subject:** `New Order #[orderNumber] - [Customer Name]`
- **Content:** Complete order details, customer information, payment status

#### Contact Inquiry Notifications
- **From:** `enquiries@glisterluxury.com`
- **To:** `[ADMIN_EMAIL]` + `londonglister@gmail.com`
- **Trigger:** When a contact form inquiry is submitted
- **Subject:** `📧 New Contact Request - [Subject] - [Name]`
- **Content:** Inquiry details, customer contact information, message

## Incoming Email Polling

All 5 business email addresses are polled for incoming messages:
- `enquiries@glisterluxury.com`
- `sales@glisterluxury.com`
- `orders@glisterluxury.com`
- `noreply@glisterluxury.com`
- `admin@glisterluxury.com`

### Auto-Reply System

- Each email address can have auto-reply enabled/disabled independently
- Auto-reply configuration is managed in Admin Settings
- Auto-replies are sent from the same email address that received the original email
- Business emails (the 5 addresses above) never receive auto-replies (prevents loops)
- Emails from noreply addresses are automatically skipped
- Duplicate prevention: Database tracks which emails have been replied to

## Email Authentication

Each email address uses SMTP authentication with the same password:
- **SMTP Host:** `process.env.EMAIL_HOST` (default: `smtp.livemail.co.uk`)
- **SMTP Port:** `process.env.EMAIL_PORT` (default: `587`)
- **Password:** `process.env.EMAIL_PASSWORD`
- **From address must match authenticated user** (for proper SMTP authentication)

## Environment Variables

Required environment variables:
- `EMAIL_FROM_ENQUIRIES` - Default: `enquiries@glisterluxury.com`
- `EMAIL_FROM_ORDERS` - Default: `orders@glisterluxury.com`
- `EMAIL_FROM_NOREPLY` - Default: `noreply@glisterluxury.com`
- `ADMIN_EMAIL` - Primary admin email (fallback: `EMAIL_USERNAME`)
- `FRONTEND_URL` - Used for logo URLs in emails (fallback: `FRONTEND_URL_2` or `http://localhost:3000`)
- `EMAIL_HOST` - SMTP server hostname
- `EMAIL_PORT` - SMTP server port
- `EMAIL_PASSWORD` - SMTP authentication password

## Logo in Emails

Customer order emails now use absolute URLs for the logo:
- **Path:** `/images/business/G.png`
- **Full URL:** `${FRONTEND_URL}/images/business/G.png`
- This ensures the logo displays correctly in email clients

## Email Footer

All customer-facing emails include footer with:
- Contact information
- Links to:
  - `enquiries@glisterluxury.com` (All purposes)
  - `sales@glisterluxury.com` (Business purposes)
- Copyright notice

