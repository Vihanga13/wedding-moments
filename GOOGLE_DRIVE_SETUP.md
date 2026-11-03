# Google Drive API Setup Guide for Wedding Moments

This guide provides step-by-step instructions for configuring Google Cloud and the Google Drive API so wedding guest photos are stored directly and securely into the couple's private Google Drive folder.

---

## 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown in the top bar and click **New Project**.
3. Name your project (e.g., `Wedding Moments 2026`) and click **Create**.
4. Make sure your newly created project is selected in the top bar.

---

## 2. Enable the Google Drive API

1. In the Google Cloud Console, navigate to **APIs & Services > Library** via the left navigation menu.
2. In the search box, type **Google Drive API** and press Enter.
3. Select **Google Drive API** from the results.
4. Click the blue **Enable** button.

---

## 3. Configure the OAuth Consent Screen

1. In the left menu, select **APIs & Services > OAuth consent screen**.
2. Select **External** user type and click **Create**.
3. Fill in the App Information:
   - **App name**: `Wedding Moments`
   - **User support email**: Select your Google email address.
   - **Developer contact information**: Enter your email address.
4. Click **Save and Continue**.
5. **Scopes**:
   - Click **Add or Remove Scopes**.
   - Search for and select: `https://www.googleapis.com/auth/drive.file`
   - *(Note: `drive.file` is the recommended least-privilege scope. It only grants the application access to files it creates or opens, keeping your other personal Drive files strictly private).*
   - Click **Update** and then **Save and Continue**.
6. **Test Users**:
   - Click **+ Add Users**.
   - Add your Google account email.
   - Click **Save and Continue**.

---

## 4. Create OAuth 2.0 Credentials

1. In the left menu, click **APIs & Services > Credentials**.
2. Click **+ Create Credentials** at the top, and choose **OAuth client ID**.
3. Select **Application type**: **Web application**.
4. Name: `Wedding Moments Web App`.
5. Under **Authorized redirect URIs**, add `https://developers.google.com/oauthplayground` (used to generate your refresh token).
6. Click **Create**.
7. Copy both values into your `.env.local` file:
   ```env
   GOOGLE_CLIENT_ID="123456789-abcdef.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-your_secret_here"
   ```

---

## 5. Create a Dedicated Wedding Photos Folder in Google Drive

1. Open [Google Drive](https://drive.google.com/) in your browser.
2. Click **New > New Folder**.
3. Name it: `Our Wedding Photos 2026`.
4. Open the newly created folder.
5. Look at the browser URL bar. The URL format is:
   `https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ`
6. Copy the string of characters after `/folders/` (this is your `GOOGLE_DRIVE_FOLDER_ID`).
7. Paste it into your `.env.local` file:
   ```env
   GOOGLE_DRIVE_FOLDER_ID="1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
   ```

---

## 6. Generate Refresh Token via OAuth Playground

To allow the server to upload guest photos directly to your Google Drive:

1. Visit the [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
2. Click the gear icon (⚙️) in the upper right:
   - Check **Use your own OAuth credentials**.
   - Enter your **OAuth Client ID** and **OAuth Client Secret**.
3. In Step 1 on the left, under **Drive API v3**, select `https://www.googleapis.com/auth/drive.file`.
4. Click **Authorize APIs** and log into your Google account.
5. In Step 2, click **Exchange authorization code for tokens**.
6. Copy the resulting **Refresh token** and set it in `.env.local`:
   ```env
   GOOGLE_REFRESH_TOKEN="1//04abcdefgh..."
   ```

---

## 7. Storage Fallback Mode

If Google Drive credentials are not yet configured or Google Cloud APIs are temporarily unreachable, **Wedding Moments automatically falls back to secure local disk storage** in `.data/originals` and `.data/previews` (when `ENABLE_LOCAL_STORAGE_FALLBACK="true"` is set). 
