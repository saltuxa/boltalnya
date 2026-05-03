"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "login" | "register";

export function AuthForm({ initialMode = "login" }: { initialMode?: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, username, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Не удалось зарегистрироваться");
      }

      const result = await signIn("credentials", {
        username,
        password,
        redirect: false
      });

      if (result?.error) throw new Error("Неверный логин или пароль");
      router.push("/app");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Что-то пошло не так");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      {mode === "register" && (
        <label className="block space-y-2 text-sm text-neutral-300">
          <span>Имя</span>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Как вас называть" />
        </label>
      )}
      <label className="block space-y-2 text-sm text-neutral-300">
        <span>Логин</span>
        <Input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          placeholder="username"
        />
      </label>
      <label className="block space-y-2 text-sm text-neutral-300">
        <span>Пароль</span>
        <Input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          placeholder="Минимум 4 символа"
          type="password"
        />
      </label>

      {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}

      <Button className="w-full" disabled={loading} type="submit" variant="primary">
        {mode === "register" ? <UserPlus size={17} /> : <LogIn size={17} />}
        {loading ? "Проверяем..." : mode === "register" ? "Зарегистрироваться" : "Войти"}
      </Button>

      <button
        className="focus-ring w-full rounded-md px-3 py-2 text-sm text-neutral-400 transition-colors hover:text-neutral-100"
        type="button"
        onClick={() => {
          setError("");
          setMode(mode === "register" ? "login" : "register");
        }}
      >
        {mode === "register" ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
      </button>
    </form>
  );
}
