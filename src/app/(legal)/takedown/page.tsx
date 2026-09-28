import { env } from "@/lib/env";

export const metadata = { title: "Takedown requests" };

export default function TakedownPage() {
  return (
    <article>
      <h1>Takedown and removal requests</h1>
      <p>{env.appName} hosts content uploaded by students. If you are an instructor, school, or rights holder and believe content on {env.appName} infringes your rights or violates a policy, we want to hear from you and will act quickly.</p>

      <h2>How to request removal</h2>
      <p>Email <a href="mailto:takedown@example.com">takedown@example.com</a> with:</p>
      <ul>
        <li>a link to, or description of, the content (the exam page URL is easiest);</li>
        <li>who you are and your relationship to the content (e.g. the instructor who wrote it);</li>
        <li>a statement that you believe in good faith the content should be removed;</li>
        <li>your contact information.</li>
      </ul>
      <p>We aim to respond within 2 business days and to remove valid requests within 5. Students can also flag content directly using the Report button on any exam.</p>

      <h2>School-wide requests</h2>
      <p>If your institution would like all content from its domain removed, or wants to be excluded from {env.appName} entirely, email the same address from an official school account.</p>

      <h2>Adding your school</h2>
      <p>Students whose school email isn&apos;t recognized yet can request that it be added at the same address.</p>
    </article>
  );
}
