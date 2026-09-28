import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { ProfileForm, DeleteAccount } from "./settings-forms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const uploads = await db.exam.count({ where: { uploaderId: user.id, status: "LIVE" } });
  return (
    <div className="mx-auto grid max-w-2xl gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">{user.email} · {user.school.name}</p>
      </div>
      <ProfileForm displayName={user.displayName} major={user.major ?? ""} gradYear={user.gradYear ?? undefined} />
      <DeleteAccount uploads={uploads} />
    </div>
  );
}
