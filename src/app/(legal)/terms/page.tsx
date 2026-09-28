import { env } from "@/lib/env";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <article>
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: September 2026. This is a starting draft; have a lawyer review it before launch.</p>

      <h2>1. What {env.appName} is</h2>
      <p>{env.appName} is a platform where verified students share study materials, including past exams, with other students at the same school. We host content that users upload. We do not create, endorse, or verify it.</p>

      <h2>2. Who can use it</h2>
      <p>You must be a current or former student with a valid school email address. You may only access content from your own school. Don&apos;t share your account or use someone else&apos;s.</p>

      <h2>3. What you may upload</h2>
      <p>Only upload material you have the right to share. By uploading you confirm that:</p>
      <ul>
        <li>sharing the material does not violate an honor code, course policy, or agreement you accepted;</li>
        <li>the material is not a current or upcoming exam;</li>
        <li>you are not uploading anyone&apos;s personal information, graded work, or private communications.</li>
      </ul>

      <h2>4. Removal of content</h2>
      <p>Anyone can report content. Rights holders and instructors can request removal at any time through our <a href="/takedown">takedown page</a>. We remove content that violates these terms or a valid takedown request and may suspend accounts that repeatedly violate them.</p>

      <h2>5. Conduct</h2>
      <p>Be respectful in comments and requests. No harassment, spam, or attempts to access other schools&apos; content.</p>

      <h2>6. No warranty</h2>
      <p>Content is provided as is. We make no promises about accuracy or that a past exam resembles a future one.</p>

      <h2>7. Changes</h2>
      <p>We may update these terms. Continued use after a change means you accept the new terms.</p>
    </article>
  );
}
