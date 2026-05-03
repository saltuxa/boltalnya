import { MessageSquare } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0F0F0F] px-5 text-neutral-100">
      <section className="w-full max-w-sm rounded-lg border border-neutral-800 bg-[#111111] p-6">
        <div className="grid h-10 w-10 place-items-center rounded-md border border-neutral-800 bg-neutral-900">
          <MessageSquare size={18} />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Вход в Болтальню</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-400">
          Войдите или создайте аккаунт через встроенный сервис-коннектор логин/пароль.
        </p>
        <div className="mt-6">
          <AuthForm />
        </div>
      </section>
    </main>
  );
}
