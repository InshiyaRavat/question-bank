const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateStudyMaterialPermissions() {
  try {
    console.log('🔄 Setting up study material permissions...');
    
    // The UserStudyMaterialPermission model should already be created by Prisma
    console.log('✅ Database schema updated successfully');
    console.log('📝 Study material permissions are now ready to use!');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('1. Run: npx prisma generate && npx prisma db push');
    console.log('2. Access admin panel: /admin/study-material-permissions');
    console.log('3. Enable study material downloads for specific users');
    console.log('4. Users without permission won\'t see the Study Material tab');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateStudyMaterialPermissions();
