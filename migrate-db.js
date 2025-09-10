const { PrismaClient } = require('@prisma/client');

async function migrateDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Adding topicStats column to TestSession table...');
    
    // Add the topicStats column if it doesn't exist
    await prisma.$executeRaw`
      ALTER TABLE "TestSession" 
      ADD COLUMN IF NOT EXISTS "topic_stats" JSONB;
    `;
    
    console.log('✅ Database migration completed successfully!');
    console.log('📊 The topicStats field has been added to the TestSession table.');
    console.log('🎯 Now when you take tests, topic statistics will be saved and visible in your personalized report.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateDatabase();
