import Link from "next/link";
import { MessageSquare, Shield, Smartphone, Zap } from "lucide-react";
import { getCurrentUser } from "@/lib/session";

const benefits = [
  { icon: Zap, title: "Быстро", text: "Сообщения, статусы и печатает обновляются без перезагрузки." },
  { icon: Shield, title: "Спокойно", text: "Понятные права, личные чаты и группы без лишнего шума." },
  { icon: Smartphone, title: "Везде", text: "Адаптивный PWA-интерфейс для десктопа и телефона." }
];

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-neutral-100">
      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-md border border-neutral-800 bg-neutral-900">
            <MessageSquare size={17} />
          </span>
          Болтальня
        </Link>
        <Link
          href={user ? "/app" : "/login"}
          className="hidden h-10 items-center rounded-md border border-neutral-800 bg-neutral-900 px-4 text-sm font-medium text-neutral-100 transition-colors hover:bg-neutral-800 sm:inline-flex"
        >
          {user ? "Открыть приложение" : "Войти"}
        </Link>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:pt-20">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium text-blue-300">Просто болтаем.</p>
          <h1 className="text-5xl font-semibold tracking-normal text-white sm:text-6xl">
            Болтальня
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-neutral-400">
            Строгий и быстрый мессенджер для дружеских разговоров, групп и спокойной повседневной переписки.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={user ? "/app" : "/login"}
              className="inline-flex h-11 items-center rounded-md border border-blue-500 bg-blue-500 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-400"
            >
              {user ? "Открыть приложение" : "Начать"}
            </Link>
            <Link
              href="#features"
              className="inline-flex h-11 items-center rounded-md border border-neutral-800 bg-neutral-900 px-4 text-sm font-medium text-neutral-100 transition-colors hover:bg-neutral-800"
            >
              Возможности
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-[#111111] shadow-2xl shadow-black/30">
          <div className="grid min-h-[460px] grid-cols-[260px_1fr] overflow-hidden rounded-lg max-md:grid-cols-1">
            <aside className="border-r border-neutral-800 bg-[#111111] p-3 max-md:hidden">
              <div className="mb-3 h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-500">
                Поиск
              </div>
              {["Друзья", "Команда", "Вечер пятницы"].map((chat, index) => (
                <div
                  key={chat}
                  className={`mb-1 rounded-md border px-3 py-3 ${index === 0 ? "border-blue-500/35 bg-blue-500/10" : "border-transparent bg-transparent"}`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{chat}</span>
                    <span className="text-xs text-neutral-500">12:{index + 14}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-neutral-500">Да, давайте просто созвонимся позже.</p>
                </div>
              ))}
            </aside>
            <div className="flex flex-col bg-[#0F0F0F]">
              <div className="flex h-14 items-center justify-between border-b border-neutral-800 px-5">
                <div>
                  <div className="text-sm font-medium">Друзья</div>
                  <div className="text-xs text-neutral-500">3 онлайн</div>
                </div>
                <div className="rounded-md border border-neutral-800 px-2 py-1 text-xs text-neutral-500">печатает...</div>
              </div>
              <div className="flex-1 space-y-4 p-5">
                <div className="max-w-[78%] rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-200">
                  Кто сегодня за кофе и короткую прогулку?
                </div>
                <div className="ml-auto max-w-[78%] rounded-lg bg-blue-500 px-4 py-3 text-sm text-white">
                  Я за. Только без сложных планов.
                </div>
                <div className="max-w-[78%] rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-200">
                  Идеально. Просто болтаем.
                </div>
              </div>
              <div className="border-t border-neutral-800 p-4">
                <div className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-3 text-sm text-neutral-500">
                  Написать сообщение
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-neutral-900 bg-[#111111]">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-14 md:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="rounded-lg border border-neutral-800 bg-[#141414] p-5">
              <benefit.icon size={19} className="text-blue-300" />
              <h2 className="mt-5 text-base font-semibold">{benefit.title}</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-400">{benefit.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
