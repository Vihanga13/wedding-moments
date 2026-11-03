const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { Readable } = require('stream');

function loadEnv() {
  const envPath = fs.existsSync(path.join(process.cwd(), '.env.local'))
    ? path.join(process.cwd(), '.env.local')
    : path.join(process.cwd(), '.env');

  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

async function verifyDrive() {
  console.log('\n--- Checking Google Drive API Configuration ---');
  loadEnv();

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  let folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (folderId && folderId.includes('folders/')) {
    const match = folderId.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (match) folderId = match[1];
  }

  let missing = [];
  if (!clientId) missing.push('GOOGLE_CLIENT_ID');
  if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET');
  if (!refreshToken) missing.push('GOOGLE_REFRESH_TOKEN');
  if (!folderId) missing.push('GOOGLE_DRIVE_FOLDER_ID');

  if (missing.length > 0) {
    console.error(`\n❌ Missing environment variables in .env.local:`);
    missing.forEach((m) => console.error(`   - ${m}`));
    console.error(`\nPlease follow GOOGLE_DRIVE_SETUP.md to obtain these values and add them to .env.local.\n`);
    process.exit(1);
  }

  console.log('✔ All 4 required environment variables are present.');
  console.log(`  Folder ID: ${folderId}`);

  try {
    console.log('\n--- Testing Authentication ---');
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    console.log('--- Testing File Upload to Target Folder ---');
    const testContent = Buffer.from('Wedding Moments Drive verification test at ' + new Date().toISOString());
    const stream = new Readable();
    stream.push(testContent);
    stream.push(null);

    const testFile = await drive.files.create({
      requestBody: {
        name: `_verification_test_${Date.now()}.txt`,
        parents: [folderId],
      },
      media: {
        mimeType: 'text/plain',
        body: stream,
      },
      fields: 'id, name, parents',
    });

    console.log(`✔ Test file created successfully in folder! Name: "${testFile.data.name}" (ID: ${testFile.data.id})`);

    console.log('--- Cleaning up Test File ---');
    await drive.files.delete({ fileId: testFile.data.id });
    console.log('✔ Test file deleted successfully.');

    console.log('\n🎉 SUCCESS! Google Drive API is fully configured and ready for live wedding photo uploads!\n');
    return;
  } catch (error) {
    console.error('\n❌ Google Drive Connection Failed:');
    if (error.response && error.response.data && error.response.data.error) {
      console.error('API Error:', JSON.stringify(error.response.data.error, null, 2));
    } else {
      console.error(error.message || error);
    }
    console.error('\nPlease double check your credentials and steps in GOOGLE_DRIVE_SETUP.md.');
    process.exit(1);
  }
}

verifyDrive();

