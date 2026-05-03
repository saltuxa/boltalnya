"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
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
  const [status, setStatus] = useState(profile.status);
  const [theme, setTheme] = useState<"dark" | "system">(profile.theme);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaved(false);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, status, theme })
    });
    setSaved(true);
  }

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-5 py-8 text-neutral-100">
      <section className="mx-auto max-w-xl rounded-lg border border-neutral-800 bg-[#111111] p-6">
        <Link href="/app" className="inline-flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-neutral-100">
          <ArrowLeft size={16} />
          Назад
        </Link>
        <div className="mt-6 flex items-center gap-4">
          <Avatar src={profile.avatar} name={name} className="h-14 w-14" />
          <div>
            <h1 className="text-2xl font-semibold">Профиль</h1>
            <p className="text-sm text-neutral-500">Имя, логин, статус и тема.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
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
            <span>Тема</span>
            <select
              className="focus-ring h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-neutral-100"
              value={theme}
              onChange={(event) => setTheme(event.target.value as "dark" | "system")}
            >
              <option value="dark">Темная</option>
              <option value="system">Системная</option>
            </select>
          </label>
          {saved && <p className="text-sm text-blue-300">Сохранено</p>}
          <Button variant="primary" onClick={save}>
            <Save size={17} />
            Сохранить
          </Button>
        </div>
      </section>
    </main>
  );
}
