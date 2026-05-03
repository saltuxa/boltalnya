import { expect, test } from "@playwright/test";

test("opens Boltalnya and completes the core chat flow", async ({ page, request }) => {
  const stamp = Date.now();
  const name = "Smoke User";
  const username = `smoke_${stamp}`;
  const password = "1234";
  const chatTitle = `Smoke chat ${stamp}`;
  const messageText = `Smoke message ${stamp}`;

  await page.goto("/");
  await expect(page).toHaveTitle(/Болтальня/);
  await expect(page.getByRole("heading", { name: "Болтальня" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Начать" })).toBeVisible();

  await page.getByRole("link", { name: "Начать" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Вход в Болтальню" })).toBeVisible();

  await page.getByRole("button", { name: /Зарегистрироваться/ }).click();
  await page.getByLabel("Имя").fill(name);
  await page.getByLabel("Логин").fill(username);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();

  await expect(page).toHaveURL(/\/app$/, { timeout: 15_000 });
  await expect(page.getByText(`@${username}`)).toBeVisible();

  const chatsResponse = await request.get("/api/chats", {
    headers: {
      cookie: await cookiesForRequest(page)
    }
  });
  expect(chatsResponse.status()).toBe(200);

  await page.getByPlaceholder("Новая группа").fill(chatTitle);
  await page.getByTitle("Создать чат").click();
  await expect(page.getByRole("button", { name: new RegExp(chatTitle) })).toBeVisible();

  await page.getByPlaceholder("Написать сообщение").fill(messageText);
  await page.keyboard.press("Enter");
  await expect(page.getByText(messageText, { exact: true })).toBeVisible();
});

async function cookiesForRequest(page: import("@playwright/test").Page) {
  const cookies = await page.context().cookies();
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}
