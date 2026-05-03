import { expect, test } from "@playwright/test";

test("opens Boltalnya and completes direct chat, group invite, and messaging flow", async ({ page, request }) => {
  const stamp = Date.now();
  const primaryName = "Smoke User";
  const primaryUsername = `smoke_${stamp}`;
  const secondaryName = "Direct Friend";
  const secondaryUsername = `friend_${stamp}`;
  const password = "1234";
  const directMessage = `Direct smoke message ${stamp}`;
  const groupTitle = `Smoke group ${stamp}`;
  const groupMessage = `Group smoke message ${stamp}`;

  await request.post("/api/register", {
    data: { name: secondaryName, username: secondaryUsername, password }
  });

  await page.goto("/");
  await expect(page).toHaveTitle(/Болтальня/);
  await expect(page.getByRole("heading", { name: "Болтальня" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Начать" })).toBeVisible();

  await page.getByRole("link", { name: "Начать" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Вход в Болтальню" })).toBeVisible();

  await page.getByRole("button", { name: /Зарегистрироваться/ }).click();
  await page.getByLabel("Имя").fill(primaryName);
  await page.getByLabel("Логин").fill(primaryUsername);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();

  await expect(page).toHaveURL(/\/app$/, { timeout: 15_000 });
  await expect(page.getByText(`@${primaryUsername}`)).toBeVisible();
  await expect(page.locator('main[data-ready="true"]')).toBeVisible();

  const chatsResponse = await request.get("/api/chats", {
    headers: {
      cookie: await cookiesForRequest(page)
    }
  });
  expect(chatsResponse.status()).toBe(200);

  const sidebar = page.locator("aside").first();
  await sidebar.getByPlaceholder("Найти пользователя").pressSequentially(secondaryUsername);
  await expect(sidebar.getByText(`@${secondaryUsername}`)).toBeVisible();
  await sidebar.getByRole("button", { name: "Написать" }).click();
  await expect(page.getByRole("button", { name: new RegExp(secondaryName) })).toBeVisible();

  await page.getByPlaceholder("Написать сообщение").fill(directMessage);
  await page.keyboard.press("Enter");
  await expect(page.getByText(directMessage, { exact: true })).toBeVisible();

  await page.getByPlaceholder("Новая группа").fill(groupTitle);
  await page.getByTitle("Создать чат").click();
  await expect(page.getByRole("button", { name: new RegExp(groupTitle) })).toBeVisible();

  const rightPanel = page.locator("aside").last();
  await rightPanel.getByPlaceholder("Найти пользователя").pressSequentially(secondaryUsername);
  await expect(rightPanel.getByText(`@${secondaryUsername}`)).toBeVisible();
  await rightPanel.getByTitle("Добавить участника").click();
  await expect(rightPanel.getByText(secondaryName)).toBeVisible();

  await page.getByPlaceholder("Написать сообщение").fill(groupMessage);
  await page.keyboard.press("Enter");
  await expect(page.getByText(groupMessage, { exact: true })).toBeVisible();
});

async function cookiesForRequest(page: import("@playwright/test").Page) {
  const cookies = await page.context().cookies();
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}
