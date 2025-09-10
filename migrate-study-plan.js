const { PrismaClient } = require('@prisma/client');

async function migrateStudyPlan() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Creating StudyPlan table...');
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "StudyPlan" (
        "id" SERIAL PRIMARY KEY,
        "user_id" TEXT NOT NULL,
        "plan_type" TEXT NOT NULL,
        "total_days" INTEGER NOT NULL,
        "total_questions" INTEGER NOT NULL,
        "questions_per_day" INTEGER NOT NULL,
        "start_date" TIMESTAMP(3) NOT NULL,
        "end_date" TIMESTAMP(3) NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL
      );
    `;
    
    console.log('🔄 Creating DailyProgress table...');
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "DailyProgress" (
        "id" SERIAL PRIMARY KEY,
        "user_id" TEXT NOT NULL,
        "plan_id" INTEGER NOT NULL,
        "date" TIMESTAMP(3) NOT NULL,
        "questions_completed" INTEGER NOT NULL DEFAULT 0,
        "questions_target" INTEGER NOT NULL,
        "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        "time_spent" INTEGER NOT NULL DEFAULT 0,
        "streak" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("user_id", "plan_id", "date")
      );
    `;
    
    console.log('🔄 Creating Achievement table...');
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Achievement" (
        "id" SERIAL PRIMARY KEY,
        "user_id" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "icon" TEXT,
        "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "metadata" JSONB
      );
    `;
    
    console.log('🔄 Creating indexes...');
    
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "StudyPlan_user_id_idx" ON "StudyPlan"("user_id");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "StudyPlan_status_idx" ON "StudyPlan"("status");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "StudyPlan_start_date_idx" ON "StudyPlan"("start_date");`;
    
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "DailyProgress_user_id_idx" ON "DailyProgress"("user_id");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "DailyProgress_plan_id_idx" ON "DailyProgress"("plan_id");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "DailyProgress_date_idx" ON "DailyProgress"("date");`;
    
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Achievement_user_id_idx" ON "Achievement"("user_id");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Achievement_type_idx" ON "Achievement"("type");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Achievement_earned_at_idx" ON "Achievement"("earned_at");`;
    
    console.log('✅ Study plan migration completed successfully!');
    console.log('📊 The following tables have been created:');
    console.log('   - StudyPlan (for storing user study plans)');
    console.log('   - DailyProgress (for tracking daily progress)');
    console.log('   - Achievement (for badges and rewards)');
    console.log('🎯 Now practice questions will be tracked in your study plan!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateStudyPlan();
