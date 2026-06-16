import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";

export default async function SettingsPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      name: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">
        Profile Settings
      </h1>

      <div className="bg-slate-900 rounded-xl p-6 max-w-2xl">
        <div className="mb-6">
          <p className="text-gray-400">
            Full Name
          </p>

          <p className="text-xl">
            {user?.name}
          </p>
        </div>

        <div className="mb-6">
          <p className="text-gray-400">
            Email
          </p>

          <p className="text-xl">
            {user?.email}
          </p>
        </div>

        <div className="mb-6">
          <p className="text-gray-400">
            Member Since
          </p>

          

          <p className="text-xl">
            {user?.createdAt.toLocaleDateString()}
          </p>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}


