// E2E: post-login SubjectDrive views, driven by localStorage.
//
// The app derives its role UI entirely from the "subject" array in
// localStorage, so we seed it with addInitScript (runs before the app boots)
// to simulate a logged-in teacher or admin without a real Firebase session.
const { test, expect } = require("@playwright/test");

test.describe("SubjectDrive - teacher", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "subject",
        JSON.stringify(["Math 6AB", "Spanish 6"])
      );
    });
  });

  test("shows the subject picker and an access button", async ({ page }) => {
    await page.goto("/subject-drive");
    await expect(page.getByText("Select Your Subject")).toBeVisible();
    await expect(page.locator("select")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Access Math 6AB Curriculum/ })
    ).toBeVisible();
  });

  test("does not show the admin gear menu", async ({ page }) => {
    await page.goto("/subject-drive");
    await expect(page.getByText("Admin", { exact: true })).toHaveCount(0);
  });
});

test.describe("SubjectDrive - admin (Full Drive)", () => {
  // NOTE: the task flags the admin "view all accounts" button as currently
  // broken. This spec asserts the INTENDED behaviour; if the gear/Admin link
  // does not render or navigate, this test fails and localizes the problem.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("subject", JSON.stringify(["Full Drive"]));
    });
  });

  test("shows the Full Drive access button, not a subject dropdown", async ({
    page,
  }) => {
    await page.goto("/subject-drive");
    await expect(page.getByText("Select Your Subject")).toHaveCount(0);
    await expect(page.locator("select")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Access Curriculum/ })
    ).toBeVisible();
  });

  test("gear reveals the Admin link that opens the users page", async ({
    page,
  }) => {
    await page.goto("/subject-drive");

    // Admin link is hidden until the gear is clicked.
    await expect(page.getByText("Admin", { exact: true })).toHaveCount(0);

    // The gear is the only inline FontAwesome svg on the page.
    await page.locator("svg.svg-inline--fa").first().click();

    const adminLink = page.getByText("Admin", { exact: true });
    await expect(adminLink).toBeVisible();

    await adminLink.click();
    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByRole("heading", { name: "Admin Page" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add User" })).toBeVisible();
  });
});

test.describe("UsersPage - direct navigation (no route guard)", () => {
  test("renders the admin controls when opened directly", async ({ page }) => {
    // There is no route guard, so /users renders for anyone. The table may be
    // empty without a live Firestore connection, but the shell must render.
    await page.goto("/users");
    await expect(page.getByRole("heading", { name: "Admin Page" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add User" })).toBeVisible();
    await expect(
      page.getByPlaceholder("Search users by name or email")
    ).toBeVisible();
  });
});
