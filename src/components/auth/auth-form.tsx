"use client";

import * as React from "react";

type Mode = "login" | "register";

export function AuthForm({ initialMode = "login" }: { initialMode?: Mode }) {
  const [mode, setMode] = React.useState<Mode>(initialMode);
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

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

      await signInWithCredentials(username, password);
      window.location.href = "/app";
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
          <input
            className="focus-ring h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-neutral-100 placeholder:text-neutral-500 transition-colors duration-150 focus:border-blue-500"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Как вас называть"
          />
        </label>
      )}
      <label className="block space-y-2 text-sm text-neutral-300">
        <span>Логин</span>
        <input
          className="focus-ring h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-neutral-100 placeholder:text-neutral-500 transition-colors duration-150 focus:border-blue-500"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          placeholder="username"
        />
      </label>
      <label className="block space-y-2 text-sm text-neutral-300">
        <span>Пароль</span>
        <input
          className="focus-ring h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-neutral-100 placeholder:text-neutral-500 transition-colors duration-150 focus:border-blue-500"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          placeholder="Минимум 4 символа"
          type="password"
        />
      </label>

      {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}

      <button
        className="focus-ring inline-flex h-10 w-full items-center justify-center rounded-md border border-blue-500 bg-blue-500 px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={loading}
        type="submit"
      >
        {loading ? "Проверяем..." : mode === "register" ? "Зарегистрироваться" : "Войти"}
      </button>

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

async function signInWithCredentials(username: string, password: string) {
  const csrfResponse = await fetch("/api/auth/csrf");
  const csrf = await csrfResponse.json();
  const body = new URLSearchParams({
    username,
    password,
    csrfToken: csrf.csrfToken,
    json: "true"
  });

  const response = await fetch("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error) {
    throw new Error("Неверный логин или пароль");
  }
}
