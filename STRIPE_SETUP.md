# Stripe Subscription Setup Guide

This guide will help you set up the proper Stripe subscription system for the Question Bank application.

## Prerequisites

1. Stripe account with API keys
2. Node.js environment with the project dependencies installed

## Step 1: Set Up Stripe Products and Prices

### Option A: Using the Setup Script (Recommended)

1. Run the setup script to create products and prices in your Stripe account:

```bash
cd /Users/dhruvdabhi/work/question-bank
node scripts/setup-stripe-products.js
```

2. The script will output the required environment variables. Add them to your `.env` file:

```env
STRIPE_PRODUCT_ID=prod_xxxxxxxxxxxxx
STRIPE_PRICE_6_MONTH=price_xxxxxxxxxxxxx
STRIPE_PRICE_12_MONTH=price_xxxxxxxxxxxxx
```

### Option B: Manual Setup in Stripe Dashboard

1. Go to your Stripe Dashboard → Products
2. Create a new product:
   - Name: "Question Bank Premium Access"
   - Description: "Access to premium question bank features"
3. Add pricing:
   - **6-Month Plan**: £10.00 every 6 months
   - **12-Month Plan**: £15.00 every 12 months
4. Copy the Product ID and Price IDs to your `.env` file

## Step 2: Configure Environment Variables

Add these variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Product and Price IDs (from Step 1)
STRIPE_PRODUCT_ID=prod_xxxxxxxxxxxxx
STRIPE_PRICE_6_MONTH=price_xxxxxxxxxxxxx
STRIPE_PRICE_12_MONTH=price_xxxxxxxxxxxxx

# App URL (for webhook endpoints)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Set Up Stripe Webhooks

1. Go to your Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://your-domain.com/api/stripe/webhook`
   - For local development: Use Stripe CLI (see Step 4)
4. Select these events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
5. Copy the webhook signing secret to your `.env` file as `STRIPE_WEBHOOK_SECRET`

## Step 4: Local Development with Stripe CLI (Optional)

For local development, use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Or download from: https://github.com/stripe/stripe-cli/releases

# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI will output a webhook secret starting with `whsec_`. Add this to your `.env` file.

## Step 5: Run Database Migration

Update your database schema:

```bash
npx prisma migrate dev --name update_subscription_model
npx prisma generate
```

## Step 6: Test the Implementation

### Test Subscription Flow

1. Start your development server:

```bash
npm run dev
```

2. Navigate to `/subscription`
3. Click on a plan button
4. Complete the Stripe Checkout flow
5. Verify the subscription is created in your database

### Test Webhook Events

1. Use Stripe CLI to trigger test events:

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

2. Check your application logs for webhook processing
3. Verify database updates

## Step 7: Production Deployment

### Environment Setup

1. Create production environment variables in your hosting platform
2. Set up production webhook endpoint in Stripe Dashboard
3. Update `NEXT_PUBLIC_APP_URL` to your production domain

### Security Checklist

- [ ] Webhook signature verification is enabled
- [ ] Environment variables are properly secured
- [ ] Stripe keys are production keys (not test keys)
- [ ] HTTPS is enabled for webhook endpoints

## Key Features

### ✅ What's Implemented

- **Proper Stripe Subscriptions**: Uses Stripe's subscription model instead of one-time payments
- **Automatic Renewals**: Stripe handles subscription renewals automatically
- **Webhook Integration**: Comprehensive webhook handling for all subscription events
- **Customer Portal**: Users can manage their subscriptions through Stripe's customer portal
- **Security**: Proper webhook signature verification
- **Error Handling**: Comprehensive error handling and logging
- **Database Sync**: Automatic synchronization between Stripe and your database

### 🔄 Subscription Lifecycle

1. **Creation**: User selects plan → Stripe Checkout → Webhook creates subscription
2. **Renewal**: Stripe automatically charges → Webhook updates subscription
3. **Modification**: User uses Customer Portal → Webhook updates subscription
4. **Cancellation**: User cancels → Webhook updates subscription status

### 📊 Admin Features

- View subscription statistics
- Process refunds
- Monitor payment logs
- Manage user subscriptions

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**

   - Check webhook URL is correct
   - Verify webhook secret in environment variables
   - Check Stripe Dashboard for failed webhook attempts

2. **Subscription not created in database**

   - Check webhook endpoint is accessible
   - Verify webhook signature verification
   - Check application logs for errors

3. **Checkout session creation fails**
   - Verify Stripe keys are correct
   - Check product and price IDs exist
   - Ensure customer creation is working

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

This will show detailed error messages and stack traces.

## Support

For issues with this implementation:

1. Check the application logs
2. Verify Stripe Dashboard for failed events
3. Test with Stripe CLI
4. Check environment variable configuration

For Stripe-specific issues, consult the [Stripe Documentation](https://stripe.com/docs).
