"use client";

export default function LogoutButton() {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      className="block text-left hover:text-red-400"
    >
      Logout
    </button>
  );
}
