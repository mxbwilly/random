import { env } from "@/lib/env";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article>
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: September 2026. Starting draft; review before launch.</p>

      <h2>What we collect</h2>
      <ul>
        <li>Your school email, name, optional major, and a hashed password.</li>
        <li>Content you post: exams, comments, requests, reports, and their timestamps.</li>
        <li>Basic technical data: IP address and browser for security and rate limiting.</li>
      </ul>

      <h2>How we use it</h2>
      <p>To verify you belong to a school, show you your school&apos;s content, notify you about replies, and keep the service safe. We do not sell your data or show ads.</p>

      <h2>Who can see what</h2>
      <p>Uploads are anonymous to other students by default. Administrators of {env.appName} can see who uploaded content in order to handle reports and takedowns. Your name is shown on comments and requests you write.</p>

      <h2>Retention and deletion</h2>
      <p>You can delete your account from Settings. Your uploads remain unless you delete them first, because other students may depend on them; they become fully anonymous.</p>

      <h2>Contact</h2>
      <p>Questions: use the address on the <a href="/takedown">takedown page</a>.</p>
    </article>
  );
}
