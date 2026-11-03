const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding / updating wedding configuration...');
  
  await prisma.weddingConfig.upsert({
    where: { id: 'default' },
    update: {
      coupleNames: 'Brunthavan & Shibaani Surudisya',
      weddingDate: 'November 28, 2026',
      venue: '',
    },
    create: {
      id: 'default',
      weddingTitle: 'Our Wedding Memories',
      coupleNames: 'Brunthavan & Shibaani Surudisya',
      weddingDate: 'November 28, 2026',
      venue: '',
      welcomeMessage: 'Thank you for celebrating with us! Every photo you take captures a memory we will treasure forever. Please upload your candid pictures from the ceremony and reception.',
      allowVideoUploads: true,
      maxFilesPerUpload: 10,
      maxFileSizeMb: 25,
      isUploadActive: true,
      isGalleryPublic: true,
      themePrimaryColor: '#BE9F58',
    }
  });
  console.log('Wedding configuration updated for Brunthavan & Shibaani Surudisya.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
