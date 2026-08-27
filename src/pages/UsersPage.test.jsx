// Integration tests for UsersPage (the admin panel / "view all accounts" page).
//
// UsersPage subscribes to the Firestore "users" collection via onSnapshot and
// renders every account in a table, plus add / edit / search / delete controls.
// We mock the Firestore + Auth SDKs so onSnapshot immediately yields a fixed
// set of users, letting us assert the rendered table and the mutation calls.
//
// NOTE: the task reports the admin "view all accounts" entry point as broken.
// These tests describe the INTENDED behaviour; failures here document the bug.
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UsersPage from "./UsersPage";
import {
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  onSnapshot: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(() => "MOCK_TS"),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({})),
  createUserWithEmailAndPassword: jest.fn(),
}));

const SEED_USERS = [
  {
    id: "admin1",
    data: {
      firstName: "Alice",
      lastName: "Anderson",
      email: "alice@gmail.com",
      role: "admin",
      subject: ["Full Drive"],
    },
  },
  {
    id: "teacher1",
    data: {
      firstName: "Tom",
      lastName: "Thompson",
      email: "tom@gmail.com",
      role: "teacher",
      subject: ["Math 6AB"],
    },
  },
];

// Wire onSnapshot to synchronously deliver SEED_USERS and hand back a no-op
// unsubscribe (so the effect cleanup does not throw).
const wireSnapshot = (users = SEED_USERS) => {
  onSnapshot.mockImplementation((_ref, cb) => {
    cb({ docs: users.map((u) => ({ id: u.id, data: () => u.data })) });
    return jest.fn();
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  window.alert = jest.fn();
  window.confirm = jest.fn(() => true);
  // CRA's Jest config sets resetMocks: true, which wipes the return values
  // declared in the jest.mock factories before every test. Re-establish the
  // ones the component reads at render time.
  getAuth.mockReturnValue({});
  wireSnapshot();
});

test("renders the admin page heading and controls", () => {
  render(<UsersPage />);
  expect(screen.getByRole("heading", { name: "Admin Page" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add User" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "CSV Bulk Upload" })
  ).toBeInTheDocument();
});

test("lists every account from the users collection", () => {
  render(<UsersPage />);
  expect(screen.getByText("Alice")).toBeInTheDocument();
  expect(screen.getByText("alice@gmail.com")).toBeInTheDocument();
  expect(screen.getByText("Tom")).toBeInTheDocument();
  expect(screen.getByText("tom@gmail.com")).toBeInTheDocument();

  // Role is rendered capitalized.
  expect(screen.getByText("Admin", { selector: "td" })).toBeInTheDocument();
  expect(screen.getByText("Teacher", { selector: "td" })).toBeInTheDocument();
});

test("search filters the account list by name/email", async () => {
  render(<UsersPage />);

  await userEvent.type(
    screen.getByPlaceholderText("Search users by name or email"),
    "tom"
  );

  await waitFor(() =>
    expect(screen.queryByText("Alice")).not.toBeInTheDocument()
  );
  expect(screen.getByText("Tom")).toBeInTheDocument();
});

test("opening Add User shows the new-user modal", async () => {
  render(<UsersPage />);

  await userEvent.click(screen.getByRole("button", { name: "Add User" }));
  expect(screen.getByRole("heading", { name: "Add New User" })).toBeInTheDocument();
  expect(screen.getByPlaceholderText("First Name")).toBeInTheDocument();
});

test("adding an admin user creates the auth account and a Full Drive doc", async () => {
  createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: "new-admin" } });
  addDoc.mockResolvedValue({ id: "doc1" });

  render(<UsersPage />);
  await userEvent.click(screen.getByRole("button", { name: "Add User" }));

  const modal = screen.getByRole("heading", { name: "Add New User" }).closest("div");
  await userEvent.type(within(modal).getByPlaceholderText("First Name"), "New");
  await userEvent.type(within(modal).getByPlaceholderText("Last Name"), "Admin");
  await userEvent.type(
    within(modal).getByPlaceholderText("Email"),
    "newadmin@gmail.com"
  );
  await userEvent.selectOptions(within(modal).getByRole("combobox"), "admin");
  await userEvent.click(within(modal).getByRole("button", { name: "Add" }));

  await waitFor(() =>
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "newadmin@gmail.com",
      "FSA123"
    )
  );
  await waitFor(() => expect(addDoc).toHaveBeenCalledTimes(1));
  expect(addDoc.mock.calls[0][1]).toEqual(
    expect.objectContaining({
      email: "newadmin@gmail.com",
      role: "admin",
      subject: ["Full Drive"],
      authProvider: "admin",
    })
  );
});

test("editing a user opens the edit modal prefilled with their data", async () => {
  render(<UsersPage />);

  // Each row has its own Edit button; pick the one in Tom's row.
  const tomRow = screen.getByText("Tom").closest("tr");
  await userEvent.click(within(tomRow).getByRole("button", { name: "Edit" }));

  expect(screen.getByRole("heading", { name: "Edit User" })).toBeInTheDocument();
  expect(screen.getByDisplayValue("tom@gmail.com")).toBeInTheDocument();
});

test("saving an edited user writes back through updateDoc", async () => {
  updateDoc.mockResolvedValue();
  render(<UsersPage />);

  const tomRow = screen.getByText("Tom").closest("tr");
  await userEvent.click(within(tomRow).getByRole("button", { name: "Edit" }));
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  await waitFor(() => expect(updateDoc).toHaveBeenCalledTimes(1));
  // handleSaveUser closes the modal (setEditingUser(null)) after the await;
  // wait for that so the trailing state update flushes inside act().
  await waitFor(() =>
    expect(screen.queryByRole("heading", { name: "Edit User" })).not.toBeInTheDocument()
  );
});

test("deleting a user (after confirm) calls deleteDoc", async () => {
  deleteDoc.mockResolvedValue();
  render(<UsersPage />);

  const tomRow = screen.getByText("Tom").closest("tr");
  await userEvent.click(within(tomRow).getByRole("button", { name: "Delete" }));

  expect(window.confirm).toHaveBeenCalled();
  await waitFor(() => expect(deleteDoc).toHaveBeenCalledTimes(1));
});

test("reset password writes the default password back", async () => {
  updateDoc.mockResolvedValue();
  render(<UsersPage />);

  const tomRow = screen.getByText("Tom").closest("tr");
  await userEvent.click(within(tomRow).getByRole("button", { name: "Reset Password" }));

  await waitFor(() => expect(updateDoc).toHaveBeenCalledTimes(1));
  expect(updateDoc.mock.calls[0][1]).toEqual({ password: "FSA123" });
});
