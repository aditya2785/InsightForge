"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();
    setErrorMessage("");

    const res = await fetch(
      "/api/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    const data = await res.json();

    if (res.ok) {
      window.location.href = "/dashboard";
    } else {
      setErrorMessage(data.message ?? "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 p-8 rounded-xl w-full max-w-md"
      >
        <h1 className="text-white text-3xl font-bold mb-6">
          Create Account
        </h1>

        <input
          type="text"
          placeholder="Full Name"
          className="w-full p-3 mb-4 rounded"
          value={formData.name}
          onChange={(e) =>
            setFormData({
              ...formData,
              name: e.target.value,
            })
          }
          required
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 rounded"
          value={formData.email}
          onChange={(e) =>
            setFormData({
              ...formData,
              email: e.target.value,
            })
          }
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 rounded"
          value={formData.password}
          onChange={(e) =>
            setFormData({
              ...formData,
              password: e.target.value,
            })
          }
          required
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 p-3 rounded text-white hover:bg-indigo-700 transition"
        >
          Register
        </button>

        {errorMessage && (
          <p className="text-red-300 text-sm text-center mt-4">
            {errorMessage}
          </p>
        )}

        <p className="text-slate-400 text-center mt-4">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-400 hover:text-blue-300"
          >
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
