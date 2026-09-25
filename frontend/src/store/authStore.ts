import { useState, useEffect } from 'react';

export interface UserProfile {
  id: number;
  username: string;
  role: 'admin' | 'user';
  portalRole: 'student' | 'teacher' | 'auditor';
  token: string;
}

const STORAGE_KEY = "master_teacher_auth_user";

export function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // 默认提供内置演示学生体验状态
      return {
        id: 1,
        username: "demo_student",
        role: "user",
        portalRole: "student",
        token: "token_1_demo_student"
      };
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredUser(user: UserProfile | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  window.dispatchEvent(new Event("auth_state_changed"));
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(getStoredUser);

  useEffect(() => {
    const handleUpdate = () => setUser(getStoredUser());
    window.addEventListener("auth_state_changed", handleUpdate);
    return () => window.removeEventListener("auth_state_changed", handleUpdate);
  }, []);

  const login = (newUser: UserProfile) => {
    saveStoredUser(newUser);
    setUser(newUser);
  };

  const logout = () => {
    saveStoredUser(null);
    setUser(null);
  };

  return { user, login, logout, isAuthenticated: Boolean(user) };
}
