-- Add soft delete fields to Question table
ALTER TABLE "Question" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "Question" ADD COLUMN "deleted_by" TEXT;

-- Add soft delete fields to Topic table
ALTER TABLE "Topic" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "Topic" ADD COLUMN "deleted_by" TEXT;

-- Add soft delete fields to Subject table
ALTER TABLE "Subject" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "Subject" ADD COLUMN "deleted_by" TEXT;

-- Create indexes for better performance on soft delete queries
CREATE INDEX "Question_deleted_at_idx" ON "Question"("deleted_at");
CREATE INDEX "Topic_deleted_at_idx" ON "Topic"("deleted_at");
CREATE INDEX "Subject_deleted_at_idx" ON "Subject"("deleted_at");
