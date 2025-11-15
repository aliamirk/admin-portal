"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import LoginForm from "../../components/LoginForm";
import { authenticate } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (username: string, password: string) => {
    console.log("🔹 Starting login process...");
    setError("");
    setLoading(true);

    try {
      const user = authenticate(username, password);
      console.log("✅ Auth result:", user);

      if (!user) {
        setError("❌ Invalid username or password.");
        setLoading(false);
        return;
      }

      router.push(user.redirect);
    } catch (err) {
      console.error("⚠️ Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl p-10 w-full max-w-md hover:shadow-green-300/50 transition-shadow duration-300"
      >
        <h2 className="text-4xl font-bold text-center text-green-600 mb-6">
          Admin Login
        </h2>

        <LoginForm onLogin={handleLogin} />

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center mt-6"
          >
            <div className="relative">
              <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <span className="mt-3 text-gray-700 font-medium">
              Logging you in...
            </span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center"
          >
            <p className="text-red-600 font-semibold">{error}</p>
          </motion.div>
        )}
      </motion.div>

      <p className="mt-6 text-gray-500 text-sm">
        © {new Date().getFullYear()} Gatepass Management System
      </p>
    </motion.div>
  );
}
