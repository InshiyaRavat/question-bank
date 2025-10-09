-- Add new fields to Subscription table for proper Stripe integration
ALTER TABLE "Subscription" ADD COLUMN "stripe_product_id" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "trial_end" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN "next_billing_date" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Subscription" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX "Subscription_user_id_idx" ON "Subscription"("user_id");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Subscription_stripe_customer_id_idx" ON "Subscription"("stripe_customer_id");
CREATE INDEX "Subscription_current_period_end_idx" ON "Subscription"("current_period_end");
