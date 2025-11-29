# Email Auto-Sending Functions Documentation

This document provides a comprehensive list of all controllers and functions that trigger automatic email sending to customers, including order confirmations, contact form submissions, password resets, and auto-reply services.

---

## **Quick Reference: Email Addresses & Their Purposes**

| Email Address | Primary Purpose | Outgoing Emails | Auto-Reply Capable | Polled for Incoming |
|---------------|----------------|-----------------|-------------------|-------------------|
| `enquiries@glisterluxury.com` | General inquiries & contact form | Admin notifications, Contact confirmations | ✅ Yes | ✅ Yes |
| `orders@glisterluxury.com` | Order-related communications | Order confirmations, Order updates | ✅ Yes | ✅ Yes |
| `sales@glisterluxury.com` | Business/sales inquiries | None (incoming only) | ✅ Yes | ✅ Yes |
| `noreply@glisterluxury.com` | System emails | Password reset emails | ✅ Yes | ✅ Yes |
| `admin@glisterluxury.com` | Administrative purposes | None (incoming only) | ✅ Yes | ✅ Yes |

**Key Points:**
- All 5 email addresses support auto-reply functionality (configurable in Admin Settings)
- All 5 email addresses are polled for incoming emails
- Auto-reply can be enabled/disabled independently for each address
- Auto-reply subject and message are customizable per email address

---

## **1. Order Placement Emails**

**Controller:** `Backend/src/controllers/orders.controller.js`

### **Function: `sendOrderEmails(order, user)`**
- **Location:** Lines 29-746
- **Type:** Internal helper function
- **Triggered by:** Order creation (both guest and authenticated users)
- **Emails Sent:**
  1. **Admin Notification Email**
     - **From:** `enquiries@glisterluxury.com`
     - **To:** Admin emails (`ADMIN_EMAIL` + `londonglister@gmail.com`)
     - **Subject:** `New Order #[orderNumber] - [Customer Name]`
     - **Content:** Complete order details, customer information, payment status
  
  2. **Customer Confirmation Email**
     - **From:** `orders@glisterluxury.com`
     - **To:** Customer email from order
     - **Subject:** `Order Confirmation #[orderNumber] - Glister Luxury`
     - **Content:** Order details, items, pricing, delivery information

### **Function: `exports.createGuestOrder`**
- **Location:** Lines 752-976
- **Route:** `POST /api/orders/guest`
- **Access:** Public (no authentication required)
- **Calls:** `sendOrderEmails()` in background (non-blocking via setTimeout)
- **Trigger:** Guest user places an order
- **Email Behavior:** Sends both admin notification and customer confirmation emails

### **Function: `exports.createOrder`**
- **Location:** Lines 1026-1277
- **Route:** `POST /api/orders`
- **Access:** Private (authenticated users)
- **Calls:** `sendOrderEmails()` in background (non-blocking via setTimeout)
- **Trigger:** Authenticated user places an order
- **Email Behavior:** Sends both admin notification and customer confirmation emails

---

## **2. Admin Message to Customer (Order Updates)**

**Controller:** `Backend/src/controllers/orders.controller.js`

### **Function: `exports.addAdminMessage`**
- **Location:** Lines 1643-1929
- **Route:** `POST /api/orders/:orderId/admin-message`
- **Access:** Private (Admin only)
- **Email Sent:**
  - **From:** `orders@glisterluxury.com`
  - **To:** Customer email from order
  - **Subject:** `Order Update #[orderNumber] - Glister Luxury`
  - **Content:** Admin message, order status, order details
- **Trigger:** Admin adds a message to an order
- **Purpose:** Notifies customer about order updates or important messages

---

## **3. Contact Form Submission Emails**

**Controller:** `Backend/src/controllers/contact.controller.js`

### **Function: `sendContactInquiryEmail(inquiry)`**
- **Location:** Lines 232-451
- **Type:** Internal helper function
- **Email Sent:**
  - **From:** `enquiries@glisterluxury.com`
  - **To:** Admin emails (varies by category)
    - Bulk orders & business inquiries → `parth@glisterluxury.com`
    - Other inquiries → `ADMIN_EMAIL` + `londonglister@gmail.com`
  - **Subject:** `📧 New Contact Request - [Subject] - [Name]`
  - **Content:** Inquiry details, customer contact information, message
- **Purpose:** Notifies admin about new contact form submissions

### **Function: `sendContactInquiryConfirmationEmail(inquiry)`**
- **Location:** Lines 456-690
- **Type:** Internal helper function
- **Email Sent:**
  - **From:** `enquiries@glisterluxury.com`
  - **To:** Customer email from contact form
  - **Subject:** `Thank You for Your Inquiry - Glister Luxury`
  - **Content:** Confirmation that inquiry was received
- **Note:** Only sent if auto-reply is NOT enabled for `enquiries@glisterluxury.com`
- **Purpose:** Provides fallback confirmation when auto-reply is disabled

### **Function: `submitInquiry`**
- **Location:** Lines 693-754
- **Route:** `POST /api/contact/inquiry`
- **Access:** Public (no authentication required)
- **Email Flow:**
  1. Creates contact inquiry in database
  2. Sends admin notification via `sendContactInquiryEmail()`
  3. Attempts to send auto-reply via `autoReplyService.sendAutoReply()` (if enabled)
  4. Falls back to `sendContactInquiryConfirmationEmail()` if auto-reply is disabled or fails
- **Trigger:** Customer submits contact form
- **Email Behavior:** 
  - Always sends admin notification
  - Sends either auto-reply OR default confirmation (not both)

---

## **4. Password Reset Emails**

**Controller:** `Backend/src/controllers/auth.controller.js`

### **Function: `exports.forgotPassword`**
- **Location:** Lines 462-701
- **Route:** `POST /api/auth/forgot-password`
- **Access:** Public
- **Email Sent:**
  - **From:** `noreply@glisterluxury.com`
  - **To:** User email address
  - **Subject:** `Password Reset Request - Glister`
  - **Content:** Password reset link with token
- **Trigger:** User requests password reset
- **Error Handling:** If email fails, reset token is cleared from user record

---

## **5. Auto-Reply Email Service**

**Service:** `Backend/src/services/autoReply.service.js`

### **Function: `sendAutoReply(emailAddress, recipientEmail, recipientName, originalSubject, messageId, emailDate, retries)`**
- **Location:** Lines 343-431
- **Type:** Service function
- **Parameters:**
  - `emailAddress`: The business email address that received the original email
  - `recipientEmail`: The email address to send auto-reply to
  - `recipientName`: The name of the recipient
  - `originalSubject`: The original email subject (optional)
  - `messageId`: The email message ID (optional)
  - `emailDate`: The email date (optional)
  - `retries`: Number of retry attempts (default: 3)
- **Returns:** `Promise<boolean>` - Success status
- **Email Sent:**
  - **From:** Same email address that received the original email
  - **To:** Sender of the original email
  - **Subject:** Configured in admin settings (with variable replacement)
  - **Content:** Configured message in admin settings (with variable replacement)
- **Triggered by:**
  1. Contact form submission (if auto-reply enabled for `enquiries@glisterluxury.com`)
  2. Incoming email processing (polling service)
- **Features:**
  - Retry logic for temporary SMTP failures (exponential backoff)
  - Variable replacement: `{name}`, `{email}`, `{date}`, `{originalSubject}`
  - HTML formatted email with logo
  - Headers to prevent auto-reply loops

### **Helper Functions in Auto-Reply Service:**

#### **`getAutoReplyConfig(emailAddress)`**
- **Location:** Lines 22-37
- **Purpose:** Gets auto-reply configuration for a specific email address
- **Returns:** Auto-reply configuration object or null

#### **`isBusinessEmail(email)`**
- **Location:** Lines 44-50
- **Purpose:** Checks if email is a business email address
- **Returns:** Boolean
- **Business Emails:**
  - `enquiries@glisterluxury.com`
  - `sales@glisterluxury.com`
  - `orders@glisterluxury.com`
  - `noreply@glisterluxury.com`
  - `admin@glisterluxury.com`

#### **`checkIfAlreadyReplied(emailAddress, senderEmail, messageId, subject, date)`**
- **Location:** Lines 61-79
- **Purpose:** Checks if email was already replied to (prevents duplicates)
- **Returns:** Promise<boolean>

#### **`markAsReplied(emailAddress, senderEmail, messageId, subject, date)`**
- **Location:** Lines 90-114
- **Purpose:** Marks email as replied in database
- **Returns:** Promise<boolean> - True if successfully marked, false if already exists

#### **`replaceVariables(text, variables)`**
- **Location:** Lines 122-132
- **Purpose:** Replaces variables in message text
- **Variables:** `{name}`, `{email}`, `{date}`, `{originalSubject}`

#### **`formatAutoReplyHTML(message, variables, req)`**
- **Location:** Lines 141-262
- **Purpose:** Formats auto-reply message as HTML email with logo and styling

#### **`createTransporter(emailAddress)`**
- **Location:** Lines 269-291
- **Purpose:** Creates Nodemailer transporter for specific email address

#### **`isTemporaryError(error)`**
- **Location:** Lines 298-330
- **Purpose:** Checks if error is temporary and should be retried

---

## **6. Incoming Email Processing (Auto-Reply Trigger)**

**Controller:** `Backend/src/controllers/incomingEmail.controller.js`

### **Function: `processIncomingEmails()`**
- **Location:** Lines 21-296
- **Type:** Internal function
- **Purpose:** Polls all business email addresses and triggers auto-replies for incoming emails
- **Email Addresses Polled:**
  - `enquiries@glisterluxury.com`
  - `sales@glisterluxury.com`
  - `orders@glisterluxury.com`
  - `noreply@glisterluxury.com`
  - `admin@glisterluxury.com`
- **Process:**
  1. Fetches unread emails from each business email address
  2. Checks if auto-reply is enabled for that email address
  3. Validates sender (skips business emails and noreply addresses)
  4. Checks if already replied (prevents duplicates)
  5. Marks as replied in database
  6. Calls `autoReplyService.sendAutoReply()` for each valid email
  7. Marks email as processed/read
- **Trigger:** Scheduled polling (via GitHub Actions or cron job)
- **Polling Method:** Configurable via `EMAIL_POLLING_METHOD` env variable (POP3 or IMAP)

### **Function: `processEmails`**
- **Location:** Lines 302-318
- **Route:** `POST /api/incoming-email/process`
- **Access:** Private (Admin)
- **Purpose:** Manual trigger for email processing
- **Calls:** `processIncomingEmails()`
- **Returns:** Processing result with emails processed count and errors

### **Function: `getStatus`**
- **Location:** Lines 324-339
- **Route:** `GET /api/incoming-email/status`
- **Access:** Private (Admin)
- **Purpose:** Get current polling status

### **Function: `testConnection`**
- **Location:** Lines 345-381
- **Route:** `POST /api/incoming-email/test-connection`
- **Access:** Private (Admin)
- **Purpose:** Test email connection for a specific email address

---

## **Complete Table of All Email Services**

This comprehensive table lists all email services in the system, including outgoing emails, admin notifications, and auto-reply services.

| # | Email Service | Type | From Address | To Address | Subject | Trigger | Function/Route | Auto-Reply Capable | Status |
|---|---------------|------|--------------|------------|---------|---------|----------------|-------------------|--------|
| 1 | **Order Confirmation (Customer)** | Customer Email | `orders@glisterluxury.com` | Customer email from order | `Order Confirmation #[orderNumber] - Glister Luxury` | Order placed (guest/authenticated) | `sendOrderEmails()` → `createOrder()` or `createGuestOrder()` | ❌ No | ✅ Active |
| 2 | **New Order Notification (Admin)** | Admin Notification | `enquiries@glisterluxury.com` | `ADMIN_EMAIL` + `londonglister@gmail.com` | `New Order #[orderNumber] - [Customer Name]` | Order placed (guest/authenticated) | `sendOrderEmails()` → `createOrder()` or `createGuestOrder()` | ❌ No | ✅ Active |
| 3 | **Order Update Notification** | Customer Email | `orders@glisterluxury.com` | Customer email from order | `Order Update #[orderNumber] - Glister Luxury` | Admin adds message to order | `addAdminMessage()` - `POST /api/orders/:orderId/admin-message` | ❌ No | ✅ Active |
| 4 | **Contact Form Admin Notification** | Admin Notification | `enquiries@glisterluxury.com` | `parth@glisterluxury.com` (bulk/business) OR `ADMIN_EMAIL` + `londonglister@gmail.com` | `📧 New Contact Request - [Subject] - [Name]` | Contact form submitted | `sendContactInquiryEmail()` → `submitInquiry()` - `POST /api/contact/inquiry` | ❌ No | ✅ Active |
| 5 | **Contact Form Confirmation (Default)** | Customer Email | `enquiries@glisterluxury.com` | Customer email from form | `Thank You for Your Inquiry - Glister Luxury` | Contact form submitted (if auto-reply disabled) | `sendContactInquiryConfirmationEmail()` → `submitInquiry()` | ❌ No | ✅ Active (Fallback) |
| 6 | **Contact Form Auto-Reply** | Auto-Reply | `enquiries@glisterluxury.com` | Customer email from form | Configurable (Admin Settings) | Contact form submitted (if auto-reply enabled) | `sendAutoReply()` → `submitInquiry()` | ✅ Yes | ⚙️ Configurable |
| 7 | **Password Reset Email** | System Email | `noreply@glisterluxury.com` | User email address | `Password Reset Request - Glister` | User requests password reset | `forgotPassword()` - `POST /api/auth/forgot-password` | ❌ No | ✅ Active |
| 8 | **Auto-Reply: enquiries@glisterluxury.com** | Auto-Reply | `enquiries@glisterluxury.com` | Sender of incoming email | Configurable (Admin Settings) | Incoming email received | `sendAutoReply()` → `processIncomingEmails()` | ✅ Yes | ⚙️ Configurable |
| 9 | **Auto-Reply: sales@glisterluxury.com** | Auto-Reply | `sales@glisterluxury.com` | Sender of incoming email | Configurable (Admin Settings) | Incoming email received | `sendAutoReply()` → `processIncomingEmails()` | ✅ Yes | ⚙️ Configurable |
| 10 | **Auto-Reply: orders@glisterluxury.com** | Auto-Reply | `orders@glisterluxury.com` | Sender of incoming email | Configurable (Admin Settings) | Incoming email received | `sendAutoReply()` → `processIncomingEmails()` | ✅ Yes | ⚙️ Configurable |
| 11 | **Auto-Reply: noreply@glisterluxury.com** | Auto-Reply | `noreply@glisterluxury.com` | Sender of incoming email | Configurable (Admin Settings) | Incoming email received | `sendAutoReply()` → `processIncomingEmails()` | ✅ Yes | ⚙️ Configurable |
| 12 | **Auto-Reply: admin@glisterluxury.com** | Auto-Reply | `admin@glisterluxury.com` | Sender of incoming email | Configurable (Admin Settings) | Incoming email received | `sendAutoReply()` → `processIncomingEmails()` | ✅ Yes | ⚙️ Configurable |

### **Legend:**
- ✅ **Active**: Email service is always active and sends emails automatically
- ⚙️ **Configurable**: Email service can be enabled/disabled and customized in Admin Settings
- ❌ **No**: This email service does not support auto-reply functionality
- ✅ **Yes**: This email address can have auto-reply configured

---

## **Email Services by Category**

### **1. Order-Related Emails**

| Service | From | To | Subject | Trigger | Auto-Reply |
|---------|------|-----|---------|---------|------------|
| Order Confirmation | `orders@glisterluxury.com` | Customer | `Order Confirmation #[orderNumber] - Glister Luxury` | Order placed | ❌ |
| New Order Admin Notification | `enquiries@glisterluxury.com` | Admin | `New Order #[orderNumber] - [Customer Name]` | Order placed | ❌ |
| Order Update Notification | `orders@glisterluxury.com` | Customer | `Order Update #[orderNumber] - Glister Luxury` | Admin message added | ❌ |

### **2. Contact Form Emails**

| Service | From | To | Subject | Trigger | Auto-Reply |
|---------|------|-----|---------|---------|------------|
| Contact Admin Notification | `enquiries@glisterluxury.com` | Admin | `📧 New Contact Request - [Subject] - [Name]` | Form submitted | ❌ |
| Contact Confirmation (Default) | `enquiries@glisterluxury.com` | Customer | `Thank You for Your Inquiry - Glister Luxury` | Form submitted (if auto-reply off) | ❌ |
| Contact Auto-Reply | `enquiries@glisterluxury.com` | Customer | Configurable | Form submitted (if auto-reply on) | ✅ |

### **3. System Emails**

| Service | From | To | Subject | Trigger | Auto-Reply |
|---------|------|-----|---------|---------|------------|
| Password Reset | `noreply@glisterluxury.com` | User | `Password Reset Request - Glister` | Password reset requested | ❌ |

### **4. Auto-Reply Services (Incoming Emails)**

| Email Address | From | To | Subject | Trigger | Configuration |
|---------------|------|-----|---------|---------|---------------|
| enquiries@glisterluxury.com | `enquiries@glisterluxury.com` | Sender | Configurable | Incoming email | Admin Settings |
| sales@glisterluxury.com | `sales@glisterluxury.com` | Sender | Configurable | Incoming email | Admin Settings |
| orders@glisterluxury.com | `orders@glisterluxury.com` | Sender | Configurable | Incoming email | Admin Settings |
| noreply@glisterluxury.com | `noreply@glisterluxury.com` | Sender | Configurable | Incoming email | Admin Settings |
| admin@glisterluxury.com | `admin@glisterluxury.com` | Sender | Configurable | Incoming email | Admin Settings |

**Note:** All auto-reply services are triggered by the incoming email polling service (`processIncomingEmails()`) which runs on a schedule (GitHub Actions or cron).

---

## **Summary Table: Functions That Trigger Auto Email Sending**

| # | Function | Controller/Service | Route | Email Type | From Address | Access |
|---|----------|-------------------|-------|------------|--------------|--------|
| 1 | `sendOrderEmails()` | `orders.controller.js` | Internal | Order confirmation | `orders@glisterluxury.com` | Internal |
| 2 | `createGuestOrder` | `orders.controller.js` | `POST /api/orders/guest` | Order confirmation | `orders@glisterluxury.com` | Public |
| 3 | `createOrder` | `orders.controller.js` | `POST /api/orders` | Order confirmation | `orders@glisterluxury.com` | Private |
| 4 | `addAdminMessage` | `orders.controller.js` | `POST /api/orders/:orderId/admin-message` | Order update | `orders@glisterluxury.com` | Admin |
| 5 | `sendContactInquiryEmail()` | `contact.controller.js` | Internal | Admin notification | `enquiries@glisterluxury.com` | Internal |
| 6 | `sendContactInquiryConfirmationEmail()` | `contact.controller.js` | Internal | Customer confirmation | `enquiries@glisterluxury.com` | Internal |
| 7 | `submitInquiry` | `contact.controller.js` | `POST /api/contact/inquiry` | Contact form emails | `enquiries@glisterluxury.com` | Public |
| 8 | `forgotPassword` | `auth.controller.js` | `POST /api/auth/forgot-password` | Password reset | `noreply@glisterluxury.com` | Public |
| 9 | `sendAutoReply()` | `autoReply.service.js` | Internal | Auto-reply | Configurable | Internal |
| 10 | `processIncomingEmails()` | `incomingEmail.controller.js` | Internal | Auto-reply (incoming) | Configurable | Internal |
| 11 | `processEmails` | `incomingEmail.controller.js` | `POST /api/incoming-email/process` | Auto-reply trigger | N/A | Admin |

---

## **How Auto-Reply Email Service Works**

### **1. Configuration**
- **Location:** Admin Settings page (`/admin/settings`)
- **Management:** Each business email address can have auto-reply enabled/disabled independently
- **Settings:**
  - **Enabled/Disabled:** Toggle auto-reply on/off
  - **Subject:** Custom subject line with variable support
  - **Message:** Custom message body with variable support
- **Variables Available:**
  - `{name}` - Recipient name
  - `{email}` - Recipient email
  - `{date}` - Current date (formatted)
  - `{originalSubject}` - Original email subject

### **2. Trigger Points**

#### **A. Contact Form Submission**
- When a customer submits the contact form:
  1. Admin notification is always sent
  2. System checks if auto-reply is enabled for `enquiries@glisterluxury.com`
  3. If enabled: Sends auto-reply using configured message
  4. If disabled: Sends default confirmation email

#### **B. Incoming Email Polling**
- Scheduled polling service (via GitHub Actions or cron):
  1. Connects to all 5 business email addresses
  2. Fetches unread emails
  3. For each email:
     - Checks if auto-reply is enabled for that email address
     - Validates sender (skips business emails and noreply addresses)
     - Checks if already replied (database check)
     - Marks as replied in database
     - Sends auto-reply using configured message
     - Marks email as processed/read

### **3. Safety Features**

#### **Duplicate Prevention**
- Database tracking: `ProcessedEmail` model stores replied emails
- Unique identifier: `emailAddress + senderEmail + messageId + subject + date`
- Race condition protection: Marks as replied BEFORE sending

#### **Business Email Protection**
- Business emails never receive auto-replies (prevents loops)
- Business email list:
  - `enquiries@glisterluxury.com`
  - `sales@glisterluxury.com`
  - `orders@glisterluxury.com`
  - `noreply@glisterluxury.com`
  - `admin@glisterluxury.com`

#### **Noreply Address Filtering**
- Automatically skips emails from:
  - Addresses containing "noreply"
  - Addresses containing "no-reply"
  - Addresses containing "donotreply"
  - Addresses containing "mailer-daemon"

#### **Auto-Submitted Header Detection**
- Checks for `Auto-Submitted` or `X-Auto-Response-Suppress` headers
- Skips emails with these headers to prevent loops

#### **Retry Logic**
- Temporary SMTP failures are retried
- Exponential backoff: 1s, 2s, 4s (max 10s)
- Maximum 3 retry attempts
- Permanent failures are logged and skipped

### **4. Email Addresses with Auto-Reply Capability**

All 5 business email addresses can have auto-reply configured:

1. **`enquiries@glisterluxury.com`**
   - Used for: General inquiries and contact form submissions
   - Auto-reply: Can be enabled/disabled independently

2. **`sales@glisterluxury.com`**
   - Used for: Business/sales inquiries
   - Auto-reply: Can be enabled/disabled independently

3. **`orders@glisterluxury.com`**
   - Used for: Order-related customer communications
   - Auto-reply: Can be enabled/disabled independently

4. **`noreply@glisterluxury.com`**
   - Used for: System emails (password reset, etc.)
   - Auto-reply: Can be enabled/disabled independently

5. **`admin@glisterluxury.com`**
   - Used for: Administrative purposes
   - Auto-reply: Can be enabled/disabled independently

---

## **Email Authentication**

All email sending uses **Nodemailer** with SMTP authentication:

- **SMTP Host:** `process.env.EMAIL_HOST` (default: `smtp.livemail.co.uk`)
- **SMTP Port:** `process.env.EMAIL_PORT` (default: `587`)
- **SMTP Secure:** `process.env.EMAIL_SECURE === 'true'` (default: `false`)
- **Password:** `process.env.EMAIL_PASSWORD` (shared across all email addresses)
- **TLS:** `rejectUnauthorized: false` (for development/testing)

**Important:** The "From" address must match the authenticated user for proper SMTP authentication:
- Admin notifications use `enquiries@glisterluxury.com` for authentication
- Customer emails use `orders@glisterluxury.com` for authentication
- Password resets use `noreply@glisterluxury.com` for authentication
- Auto-replies use the same email address that received the original email

---

## **Environment Variables**

Required environment variables for email functionality:

```env
# Email Server Configuration
EMAIL_HOST=smtp.livemail.co.uk
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_PASSWORD=your_email_password

# Email Addresses
EMAIL_FROM_ENQUIRIES=enquiries@glisterluxury.com
EMAIL_FROM_ORDERS=orders@glisterluxury.com
EMAIL_FROM_NOREPLY=noreply@glisterluxury.com

# Admin Configuration
ADMIN_EMAIL=admin@example.com
EMAIL_USERNAME=admin@example.com  # Fallback for ADMIN_EMAIL

# Frontend URL (for email logos and links)
FRONTEND_URL=https://yourdomain.com
FRONTEND_URL_2=https://www.yourdomain.com  # Fallback

# Email Polling (for incoming email processing)
EMAIL_POLLING_METHOD=pop3  # or 'imap'
POP3_HOST=pop3.livemail.co.uk  # For POP3
IMAP_HOST=imap.livemail.co.uk  # For IMAP
```

---

## **Email Flow Diagrams**

### **Order Placement Flow**
```
Customer Places Order
    ↓
createOrder() or createGuestOrder()
    ↓
sendOrderEmails()
    ├──→ Admin Notification (enquiries@glisterluxury.com)
    └──→ Customer Confirmation (orders@glisterluxury.com)
```

### **Contact Form Submission Flow**
```
Customer Submits Contact Form
    ↓
submitInquiry()
    ├──→ Admin Notification (enquiries@glisterluxury.com)
    └──→ Customer Response
            ├──→ Auto-Reply (if enabled)
            └──→ Default Confirmation (if auto-reply disabled)
```

### **Incoming Email Auto-Reply Flow**
```
Scheduled Polling (GitHub Actions/Cron)
    ↓
processIncomingEmails()
    ↓
For each business email address:
    ├──→ Fetch unread emails
    ├──→ Check auto-reply enabled?
    ├──→ Validate sender (skip business/noreply)
    ├──→ Check if already replied?
    ├──→ Mark as replied in database
    └──→ sendAutoReply()
            └──→ Send auto-reply email
```

---

## **Notes**

1. **Non-Blocking Email Sending:** Order emails are sent in background using `setTimeout` to avoid blocking the API response
2. **Error Handling:** Email failures don't fail the main operation (order creation, contact submission, etc.)
3. **Logo URLs:** All emails use absolute URLs from `FRONTEND_URL` environment variable for logo display
4. **HTML Formatting:** All emails are sent as HTML with inline CSS for maximum compatibility
5. **Database Tracking:** Auto-reply system uses `ProcessedEmail` model to prevent duplicate replies
6. **Polling Frequency:** Incoming email polling is typically scheduled every 5-15 minutes (configured in GitHub Actions or cron)

---

**Last Updated:** Generated from codebase analysis
**Maintained By:** Development Team

