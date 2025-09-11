const { PrismaClient } = require('@prisma/client');

async function migrateSettings() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Creating Settings table...');
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Settings" (
        "id" SERIAL PRIMARY KEY,
        "key" TEXT NOT NULL UNIQUE,
        "value" TEXT NOT NULL,
        "description" TEXT,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_by" TEXT
      );
    `;
    
    console.log('🔄 Creating indexes...');
    
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Settings_key_idx" ON "Settings"("key");`;
    
    console.log('🔄 Inserting default settings...');
    
    // Insert default accuracy threshold
    await prisma.settings.upsert({
      where: { key: "accuracyThreshold" },
      update: {},
      create: {
        key: "accuracyThreshold",
        value: "50",
        description: "Accuracy threshold for marking topics as 'needs attention' in personalized reports (percentage)"
      }
    });
    
    console.log('✅ Settings migration completed successfully!');
    console.log('📊 The following settings have been created:');
    console.log('   - accuracyThreshold: 50% (default)');
    console.log('🎯 Admins can now configure the accuracy threshold from /admin/settings');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateSettings();
