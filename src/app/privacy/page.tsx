import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Brunthavan & Shibaani Wedding Moments',
  description: 'Privacy Policy for the Brunthavan & Shibaani Wedding Moments photo sharing application.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between pb-6 border-b border-gold-200/60">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-medium text-stoneDark/60 hover:text-stoneDark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <span className="text-xs text-stoneDark/50">Last updated: November 2026</span>
      </div>

      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-gold-200/80 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-gold-600">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="font-serif-wedding text-3xl sm:text-4xl text-stoneDark font-semibold">
            Privacy Policy
          </h1>
        </div>

        <div className="prose prose-stone text-sm text-stoneDark/80 space-y-4">
          <p>
            Welcome to <strong>Wedding Moments</strong>, the private wedding photo collection application for 
            <strong> Brunthavan &amp; Shibaani</strong>. We respect your privacy and are committed to protecting the photos and information you share.
          </p>

          <h2 className="text-lg font-semibold text-stoneDark pt-2">1. Information We Collect</h2>
          <p>
            When you upload wedding photos, we collect:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>The photo files you choose to upload.</li>
            <li>Optional guest name and captions you provide.</li>
            <li>An anonymous, device-generated token stored in your browser local storage to display your personal upload history.</li>
          </ul>

          <h2 className="text-lg font-semibold text-stoneDark pt-2">2. How Your Photos Are Used</h2>
          <p>
            All uploaded photos are securely transferred directly to the couple&apos;s private Google Drive wedding folder. 
            Photos are stored solely for Brunthavan &amp; Shibaani&apos;s personal wedding memories and are never sold, rented, or shared with third parties or advertisers.
          </p>

          <h2 className="text-lg font-semibold text-stoneDark pt-2">3. Google Drive API Integration</h2>
          <p>
            This application uses Google Drive APIs to store uploaded files directly into a designated private folder owned by the couple. 
            Our use of information received from Google APIs adheres to the Google API Services User Data Policy, including Limited Use requirements.
          </p>

          <h2 className="text-lg font-semibold text-stoneDark pt-2">4. Data Retention and Security</h2>
          <p>
            Photos and associated metadata are stored with encryption in transit (HTTPS/TLS) and securely held in the couple&apos;s Google Drive album.
          </p>

          <h2 className="text-lg font-semibold text-stoneDark pt-2">5. Contact Information</h2>
          <p>
            If you have any questions regarding this Privacy Policy or wish to have a photo removed, please contact the wedding organizers.
          </p>
        </div>
      </div>
    </div>
  );
}
