"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImagePlus, Save } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

type Profile = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  status: string;
  theme: "dark" | "system";
};

export function SettingsForm({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [status, setStatus] = useState(profile.status);
  const [theme, setTheme] = useState<"dark" | "system">(profile.theme);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function uploadAvatar(file: File | undefined) {
    if (!file) return;
    setError("");
    setMessage("");
    setUploading(true);

    const form = new FormData();
    form.append("avatar", file);
    const response = await fetch("/api/uploads/avatar", {
      method: "POST",
      body: form
    });
    const data = await response.json();
    setUploading(false);

    if (!response.ok) {
      setError(data.error ?? "Не удалось загрузить аватар");
      return;
    }

    setAvatar(data.url);
    setMessage("Аватар обновлен");
  }

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, status, theme })
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(data.error ?? "Не удалось сохранить профиль");
      return;
    }

    setName(data.profile.name);
    setUsername(data.profile.username);
    setAvatar(data.profile.avatar);
    setStatus(data.profile.status);
    setTheme(data.profile.theme);
    setMessage("Сохранено");
  }

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-5 py-8 text-neutral-100">
      <section className="mx-auto max-w-xl rounded-lg border border-neutral-800 bg-[#111111] p-6">
        <Link href="/app" className="inline-flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-neutral-100">
          <ArrowLeft size={16} />
          Назад
        </Link>
        <div className="mt-6 flex items-center gap-4">
          <Avatar src={avatar} name={name} className="h-14 w-14" />
          <div>
            <h1 className="text-2xl font-semibold">Профиль</h1>
            <p className="text-sm text-neutral-500">Имя, логин, аватар, статус и сохраненная тема.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block space-y-2 text-sm text-neutral-300">
            <span>Аватар</span>
            <label className="focus-ring inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-3 text-sm transition-colors hover:bg-neutral-800">
              <ImagePlus size={16} />
              {uploading ? "Загружаем..." : "Загрузить изображение"}
              <input
                accept="image/*"
                className="sr-only"
                type="file"
                onChange={(event) => void uploadAvatar(event.target.files?.[0])}
              />
            </label>
          </label>
          <label className="block space-y-2 text-sm text-neutral-300">
            <span>Имя</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="block space-y-2 text-sm text-neutral-300">
            <span>Логин</span>
            <Input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label className="block space-y-2 text-sm text-neutral-300">
            <span>Статус</span>
            <Textarea value={status} onChange={(event) => setStatus(event.target.value)} />
          </label>
          <label className="block space-y-2 text-sm text-neutral-300">
            <span>Сохраненная тема</span>
            <select
              className="focus-ring h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-neutral-100"
              value={theme}
              onChange={(event) => setTheme(event.target.value as "dark" | "system")}
            >
              <option value="dark">Темная</option>
              <option value="system">Системная</option>
            </select>
          </label>
          {message && <p className="text-sm text-blue-300">{message}</p>}
          {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
          <Button variant="primary" onClick={save} disabled={saving}>
            <Save size={17} />
            {saving ? "Сохраняем..." : "Сохранить"}
          </Button>
        </div>
      </section>
    </main>
  );
}
