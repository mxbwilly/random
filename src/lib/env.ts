/** Central place for environment variables so typos fail loudly in one file. */
function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  appName: optional("APP_NAME", "BackExams"),
  appUrl: optional("APP_URL", "http://localhost:3000"),
  adminEmails: optional("ADMIN_EMAILS")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  resendApiKey: optional("RESEND_API_KEY"),
  emailFrom: optional("EMAIL_FROM", "BackExams <noreply@example.com>"),
  supabaseUrl: optional("SUPABASE_URL"),
  supabaseServiceRoleKey: optional("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseBucket: optional("SUPABASE_STORAGE_BUCKET", "exams"),
  maxUploadBytes: Number(optional("MAX_UPLOAD_MB", "25")) * 1024 * 1024,
  isProduction: process.env.NODE_ENV === "production",
};
