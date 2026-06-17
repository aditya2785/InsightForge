"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();
    setErrorMessage("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      window.location.href = "/dashboard";
    } else {
      setErrorMessage(data.message ?? "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md mb-6">
        <Link
          href="/"
          className="text-slate-400 hover:text-white transition"
        >
          Back to Home
        </Link>

        <Link href="/">
          <h1 className="text-3xl font-bold text-blue-400 mt-4 cursor-pointer hover:text-blue-300 transition">
            InsightForge
          </h1>
        </Link>

        <p className="text-slate-400 mt-2">
          DATA. INSIGHTS. IMPACT.
        </p>
      </div>

      <form
        onSubmit={handleLogin}
        className="bg-slate-900 p-8 rounded-xl w-full max-w-md shadow-xl"
      >
        <h2 className="text-white text-3xl font-bold mb-6">
          Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 rounded bg-slate-800 text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 rounded bg-slate-800 text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 p-3 rounded text-white hover:bg-indigo-700 transition"
        >
          Login
        </button>

        {errorMessage && (
          <p className="text-red-300 text-sm text-center mt-4">
            {errorMessage}
          </p>
        )}

        <p className="text-slate-400 text-center mt-4">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-blue-400 hover:text-blue-300"
          >
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
