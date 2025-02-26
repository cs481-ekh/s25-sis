'use client';

import React from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";

export default function Page() {
    const router = useRouter();

    const handleLogin = () => {
        document.cookie = 'loggedIn=true; path=/';
        router.push('/'); // Redirect to home after login
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20 bg-gray-100">
          <h1 className="text-2xl font-bold mb-4">Enter Admin ID to login</h1>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
              <input
                  type="text"
                  placeholder="Enter Admin ID"
                  className="p-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Link href="/" passHref>
                  <button
                    className="px-6 py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 transition"
                    onClick={handleLogin}
                  >
                    Login
                  </button>
              </Link>
          </div>
      </div>
          );
}