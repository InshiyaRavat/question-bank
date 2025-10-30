# Coupon & Discount System Documentation

## Overview

This document describes the comprehensive coupon and discount system implemented using Stripe's native coupon and promotion code functionality. The system follows industry standards and provides both admin management capabilities and customer-facing discount features.

## Features Implemented

### 1. Admin Coupon Management

- **Create Coupons**: Admins can create percentage-based or fixed-amount discounts
- **Create Promotion Codes**: Customer-facing codes that map to underlying coupons
- **View & Manage**: List, view details, and delete coupons/promotion codes
- **Validation**: Real-time validation of coupon codes
- **Restrictions**: Set expiration dates, usage limits, and customer restrictions

### 2. Customer Experience

- **Coupon Input**: User-friendly interface for entering promotion codes
- **Real-time Validation**: Instant feedback on coupon validity
- **Price Calculation**: Live discount calculation and display
- **Checkout Integration**: Seamless integration with Stripe Checkout

### 3. Database Tracking

- **Subscription Records**: Track which coupons were applied to subscriptions
- **Discount Amounts**: Store original and discounted amounts
- **Audit Trail**: Complete history of coupon usage

## Technical Implementation

### API Endpoints

#### Admin Coupon Management

- `GET /api/admin/coupons` - List all coupons
- `POST /api/admin/coupons` - Create new coupon
- `GET /api/admin/coupons/[couponId]` - Get specific coupon
- `DELETE /api/admin/coupons/[couponId]` - Delete coupon

#### Admin Promotion Code Management

- `GET /api/admin/promotion-codes` - List all promotion codes
- `POST /api/admin/promotion-codes` - Create new promotion code
- `GET /api/admin/promotion-codes/[promotionCodeId]` - Get specific promotion code
- `POST /api/admin/promotion-codes/[promotionCodeId]` - Update promotion code

#### Customer-Facing

- `POST /api/coupons/validate` - Validate coupon/promotion code
- `POST /api/stripe/create-checkout-session-with-coupon` - Create checkout with discount

### Database Schema Updates

Added to the `Subscription` model:

```sql
appliedCouponId      String?   @map("applied_coupon_id")
appliedPromotionCode String?   @map("applied_promotion_code")
discountAmount       Float?    @map("discount_amount")
originalAmount       Float?    @map("original_amount")
```

### Components

#### Admin Interface

- **Location**: `/admin/coupons`
- **Features**:
  - Tabbed interface for coupons and promotion codes
  - Create/edit forms with validation
  - Real-time search and filtering
  - Copy-to-clipboard functionality

#### Customer Interface

- **CouponInput Component**: Reusable component for coupon entry
- **SubscriptionWithCoupons**: Enhanced subscription page with discount support
- **Features**:
  - Real-time validation
  - Discount preview
  - Order summary with applied discounts

## Usage Guide

### For Admins

#### Creating a Coupon

1. Navigate to `/admin/coupons`
2. Click "Create Coupon"
3. Fill in the form:
   - **Name**: Display name (e.g., "25% Off")
   - **ID**: Optional unique identifier
   - **Discount Type**: Percentage or fixed amount
   - **Duration**: Once, repeating, or forever
   - **Limits**: Max redemptions, expiration date
4. Click "Create Coupon"

#### Creating a Promotion Code

1. In the "Promotion Codes" tab, click "Create Promotion Code"
2. Select an existing coupon
3. Set the customer-facing code (e.g., "SAVE25")
4. Configure restrictions:
   - First-time customers only
   - Minimum purchase amount
   - Expiration date
5. Click "Create Promotion Code"

### For Customers

#### Using a Coupon

1. Navigate to the subscription page
2. Select a plan
3. Enter the promotion code in the coupon input field
4. The system will validate and show the discount
5. Proceed to checkout with the applied discount

## Stripe Integration

### Coupon Types Supported

- **Percentage Discounts**: e.g., 25% off
- **Fixed Amount Discounts**: e.g., £10 off
- **Duration Options**:
  - `once`: Single use per customer
  - `repeating`: Recurring discount for subscription duration
  - `forever`: Permanent discount for subscription lifetime

### Promotion Code Features

- **Customer Restrictions**: Limit to specific customers
- **First-time Customer**: Restrict to new customers only
- **Minimum Amount**: Require minimum purchase amount
- **Expiration**: Set expiration dates
- **Usage Limits**: Limit total redemptions

### Webhook Integration

The system automatically tracks coupon usage through Stripe webhooks:

- Extracts coupon information from subscription creation
- Calculates discount amounts
- Stores coupon metadata in the database

## Security & Validation

### Server-side Validation

- All coupon operations require admin authentication
- Stripe API calls are validated server-side
- Coupon codes are validated against Stripe before application

### Client-side Validation

- Real-time coupon validation
- User-friendly error messages
- Prevents invalid coupon submission

## Testing

### Test Page

A test page is available at `/test-coupons` to demonstrate the coupon functionality.

### Test Scenarios

1. **Valid Coupon**: Create a coupon and test application
2. **Expired Coupon**: Test with expired coupon
3. **Usage Limits**: Test with maxed-out coupon
4. **Invalid Code**: Test with non-existent code
5. **Admin Management**: Test CRUD operations

## Migration

To apply the database changes:

```bash
npx prisma migrate dev --name add_coupon_tracking_to_subscriptions
```

## Environment Variables

Ensure these Stripe environment variables are set:

- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Best Practices

### For Admins

1. **Test Coupons**: Always test coupons before making them public
2. **Set Limits**: Use redemption limits to prevent abuse
3. **Monitor Usage**: Regularly check coupon usage in Stripe Dashboard
4. **Clear Naming**: Use descriptive names for easy identification

### For Developers

1. **Error Handling**: Always handle Stripe API errors gracefully
2. **Validation**: Validate all inputs server-side
3. **Logging**: Log coupon operations for audit trails
4. **Testing**: Test with various coupon configurations

## Troubleshooting

### Common Issues

1. **Coupon Not Applying**: Check if coupon is active and not expired
2. **Validation Errors**: Ensure coupon exists in Stripe
3. **Database Errors**: Run migration if schema is outdated
4. **Webhook Issues**: Check webhook endpoint configuration

### Debug Steps

1. Check Stripe Dashboard for coupon status
2. Verify webhook events are being received
3. Check server logs for error messages
4. Validate database schema matches code

## Future Enhancements

Potential improvements for the coupon system:

1. **Bulk Coupon Creation**: Create multiple coupons at once
2. **Analytics Dashboard**: Detailed coupon usage analytics
3. **Email Integration**: Send coupon codes via email
4. **A/B Testing**: Test different discount strategies
5. **Customer Segmentation**: Target specific customer groups
6. **Expiration Notifications**: Alert customers before coupons expire

## Support

For technical support or questions about the coupon system:

1. Check this documentation first
2. Review Stripe's official documentation
3. Check server logs for error details
4. Contact the development team with specific error messages
