"use client";
import { useState, useEffect } from 'react';

type AuthUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const json = await res.json();
          setUser(json.user || null);
        }
      } catch {
        // Ignore fetch errors for unauthenticated state
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  return { user, loading };
}

export default useAuth;
