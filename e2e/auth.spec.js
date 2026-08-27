// E2E: unauthenticated auth flows (login page, navigation, sign-up validation).
// These paths need no Firebase round-trip, so they are fully deterministic.
const { test, expect } = require("@playwright/test");

test.describe("Login page", () => {
  test("renders the login form", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("Enter your email address")).toBeVisible();
    await expect(page.getByPlaceholder("Enter your password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  });

  test("the 'here' link navigates to the sign-up page", async ({ page }) => {
    await page.goto("/");
    await page.getByText("here").click();
    await expect(page).toHaveURL(/\/sign-up$/);
    await expect(
      page.getByRole("button", { name: "Create Account" })
    ).toBeVisible();
  });
});

test.describe("Sign-up page validation", () => {
  test("rejects a non-gmail email with an alert", async ({ page }) => {
    await page.goto("/sign-up");

    const dialogs = [];
    page.on("dialog", async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.accept();
    });

    await page.getByPlaceholder("Enter your name").fill("Ada Byte");
    await page.getByPlaceholder("Enter your email address").fill("ada@example.com");
    await page.getByPlaceholder("Enter your password").fill("secret");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect.poll(() => dialogs).toContain("Only Email Format is allowed.");
    // Should not have navigated away.
    await expect(page).toHaveURL(/\/sign-up$/);
  });

  test("rejects an empty password with an alert", async ({ page }) => {
    await page.goto("/sign-up");

    const dialogs = [];
    page.on("dialog", async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.accept();
    });

    await page.getByPlaceholder("Enter your name").fill("Ada Byte");
    await page.getByPlaceholder("Enter your email address").fill("ada@gmail.com");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect.poll(() => dialogs).toContain("Type your password");
  });
});
