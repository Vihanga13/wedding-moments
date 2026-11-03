const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial wedding configuration...');
  
  const existingConfig = await prisma.weddingConfig.findUnique({
    where: { id: 'default' }
  });

  if (!existingConfig) {
    await prisma.weddingConfig.create({
      data: {
        id: 'default',
        weddingTitle: 'Our Wedding Moments',
        coupleNames: 'Sarah & Michael',
        weddingDate: 'October 24, 2026',
        venue: 'Grand Chateau Garden Estate, Florence',
        welcomeMessage: 'Thank you for celebrating with us! Every photo you take captures a memory we will treasure forever. Please upload your candid pictures from the ceremony and reception.',
        allowVideoUploads: true,
        maxFilesPerUpload: 10,
        maxFileSizeMb: 25,
        isUploadActive: true,
        isGalleryPublic: true,
        themePrimaryColor: '#BE9F58',
      }
    });
    console.log('Default wedding configuration created.');
  } else {
    console.log('Wedding configuration already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
