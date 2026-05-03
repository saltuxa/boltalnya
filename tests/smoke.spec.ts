import { expect, test } from "@playwright/test";

test("opens Boltalnya and verifies visible controls across the app", async ({ page, request }) => {
  const stamp = Date.now();
  const primaryName = "Smoke User";
  const primaryUsername = `smoke_${stamp}`;
  const secondaryName = "Direct Friend";
  const secondaryUsername = `friend_${stamp}`;
  const password = "1234";
  const directMessage = `Direct smoke message ${stamp}`;
  const emojiTail = ` emoji smoke ${stamp}`;
  const replyMessage = `Reply smoke message ${stamp}`;
  const editedMessage = `Edited smoke message ${stamp}`;
  const groupTitle = `Smoke group ${stamp}`;
  const groupMessage = `Group smoke message ${stamp}`;

  await request.post("/api/register", {
    data: { name: secondaryName, username: secondaryUsername, password }
  });

  await page.goto("/");
  await expect(page).toHaveTitle(/Болтальня/);
  await expect(page.getByRole("heading", { name: "Болтальня" })).toBeVisible();
  await page.getByRole("link", { name: "Возможности" }).click();
  await expect(page.locator("#features")).toBeVisible();

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

  await page.getByTitle("Эмодзи").click();
  await page.getByRole("button", { name: "🙂" }).click();
  await expect(page.getByPlaceholder("Написать сообщение")).toHaveValue("🙂");
  await page.getByPlaceholder("Написать сообщение").pressSequentially(emojiTail);
  await page.getByTitle("Отправить").click();
  const emojiMessage = `🙂${emojiTail}`;
  await expect(page.getByText(emojiMessage, { exact: true })).toBeVisible();

  const emojiArticle = page.locator("article").filter({ hasText: emojiMessage });
  await emojiArticle.getByTitle("Реакция 👍").click();
  await expect(emojiArticle.getByRole("button", { name: "👍 1" })).toBeVisible();
  await emojiArticle.getByRole("button", { name: "👍 1" }).click();
  await expect(emojiArticle.getByRole("button", { name: "👍 1" })).toHaveCount(0);

  const firstArticle = page.locator("article").filter({ hasText: directMessage });
  await firstArticle.getByTitle("Ответить").click();
  await expect(page.getByText(`Ответ ${primaryName}: ${directMessage}`)).toBeVisible();
  await page.getByPlaceholder("Написать сообщение").fill(replyMessage);
  await page.keyboard.press("Enter");
  const replyArticle = page.locator("article").filter({ hasText: replyMessage });
  await expect(replyArticle.getByText(`Ответ ${primaryName}: ${directMessage}`)).toBeVisible();

  await replyArticle.getByTitle("Редактировать").click();
  await expect(page.getByText("Редактирование сообщения")).toBeVisible();
  await page.getByPlaceholder("Написать сообщение").fill(editedMessage);
  await page.getByTitle("Сохранить").click();
  const editedArticle = page.locator("article").filter({ hasText: editedMessage });
  await expect(editedArticle.getByText("изменено")).toBeVisible();

  await editedArticle.getByTitle("Удалить").click();
  await expect(page.getByText("Сообщение удалено")).toBeVisible();

  await page.getByPlaceholder("Поиск сообщений").fill("nothing");
  await page.getByTitle("Ещё").click();
  await expect(page.getByText("Обновить чат")).toBeVisible();
  await page.getByText("Очистить поиск").click();
  await expect(page.getByPlaceholder("Поиск сообщений")).toHaveValue("");
  await page.getByTitle("Ещё").click();
  await page.getByText("Скопировать ID чата").click();
  await expect(page.getByText("ID чата скопирован")).toBeVisible();
  await page.getByTitle("Ещё").click();
  await page.getByText("Скрыть участников").click();
  await expect(page.getByRole("heading", { name: "Профиль" })).toHaveCount(0);
  await page.getByTitle("Ещё").click();
  await page.getByText("Показать участников").click();
  await expect(page.getByRole("heading", { name: "Профиль" })).toBeVisible();
  await page.getByTitle("Уведомления").click();
  await expect(page.getByText(/Уведомления/)).toBeVisible();

  await page.getByTitle("Настройки").click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("heading", { name: "Профиль" })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      "base64"
    )
  });
  await expect(page.getByText("Аватар обновлен")).toBeVisible();
  await page.getByLabel("Имя").fill(`${primaryName} Updated`);
  await page.getByLabel("Статус").fill("Smoke status");
  await page.getByLabel("Сохраненная тема").selectOption("system");
  await page.getByRole("button", { name: /Сохранить/ }).click();
  await expect(page.getByText("Сохранено")).toBeVisible();
  await page.getByRole("link", { name: "Назад" }).click();
  await expect(page).toHaveURL(/\/app$/);

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
