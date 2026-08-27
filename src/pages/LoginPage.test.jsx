// Integration tests for LoginPage.
// We render the real component but mock the auth layer (firebase_auth) and the
// router's useNavigate so we can assert on the interaction between the form,
// signIn(), and navigation without hitting Firebase.
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./LoginPage";
import { signIn } from "../utils/firebase_auth";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock("../utils/firebase_auth", () => ({
  signIn: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test("renders the login form", () => {
  render(<LoginPage />);
  expect(screen.getByText("Login", { selector: "div" })).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Enter your email address")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
});

test("submits typed credentials and navigates on success", async () => {
  signIn.mockResolvedValue(true);

  render(<LoginPage />);
  await userEvent.type(
    screen.getByPlaceholderText("Enter your email address"),
    "teacher@gmail.com"
  );
  await userEvent.type(screen.getByPlaceholderText("Enter your password"), "secret");
  await userEvent.click(screen.getByRole("button", { name: "Login" }));

  expect(signIn).toHaveBeenCalledWith("teacher@gmail.com", "secret");
  await waitFor(() =>
    expect(mockNavigate).toHaveBeenCalledWith("/subject-drive")
  );
});

test("does not navigate when sign in fails", async () => {
  signIn.mockResolvedValue(false);

  render(<LoginPage />);
  await userEvent.type(
    screen.getByPlaceholderText("Enter your email address"),
    "teacher@gmail.com"
  );
  await userEvent.type(screen.getByPlaceholderText("Enter your password"), "wrong");
  await userEvent.click(screen.getByRole("button", { name: "Login" }));

  await waitFor(() => expect(signIn).toHaveBeenCalled());
  expect(mockNavigate).not.toHaveBeenCalled();
});

test("the 'here' link navigates to sign up", async () => {
  render(<LoginPage />);
  await userEvent.click(screen.getByText("here"));
  expect(mockNavigate).toHaveBeenCalledWith("/sign-up");
});
