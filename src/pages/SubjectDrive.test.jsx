// Integration tests for SubjectDrive.
//
// SubjectDrive derives its entire UI from the "subject" array in localStorage:
//   - a teacher (specific subjects) sees a subject dropdown + "Access ... Curriculum"
//   - an admin ("Full Drive") sees the gear menu that links to /users
//
// The admin gear -> "Admin" -> /users path is the "view all accounts" entry
// point the task flags as currently broken. The admin tests below assert the
// INTENDED behaviour, so if the button is broken they will fail and pinpoint
// exactly where.
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SubjectDrive from "./SubjectDrive";
import { driveLink } from "../utils/f_config";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  window.alert = jest.fn();
  window.open = jest.fn();
});

describe("teacher (specific subjects)", () => {
  beforeEach(() => {
    window.localStorage.setItem(
      "subject",
      JSON.stringify(["Math 6AB", "Spanish 6"])
    );
  });

  test("shows the subject picker with the stored subjects", () => {
    render(<SubjectDrive />);
    expect(screen.getByText("Select Your Subject")).toBeInTheDocument();

    const select = screen.getByRole("combobox");
    const options = within(select).getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Math 6AB", "Spanish 6"]);
  });

  test("opens the Drive link for the selected subject", async () => {
    render(<SubjectDrive />);

    // Default selection is the first subject.
    await userEvent.click(
      screen.getByRole("button", { name: /Access Math 6AB Curriculum/ })
    );
    expect(window.open).toHaveBeenCalledWith(driveLink["Math 6AB"], "_blank");
  });

  test("switching the dropdown opens the matching Drive link", async () => {
    render(<SubjectDrive />);

    await userEvent.selectOptions(screen.getByRole("combobox"), "Spanish 6");
    await userEvent.click(
      screen.getByRole("button", { name: /Access Spanish 6 Curriculum/ })
    );
    expect(window.open).toHaveBeenCalledWith(driveLink["Spanish 6"], "_blank");
  });

  test("does not render the admin gear menu for teachers", () => {
    const { container } = render(<SubjectDrive />);
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });
});

describe("admin (Full Drive)", () => {
  beforeEach(() => {
    window.localStorage.setItem("subject", JSON.stringify(["Full Drive"]));
  });

  test("shows the Full Drive access button, not a subject dropdown", () => {
    render(<SubjectDrive />);
    expect(screen.queryByText("Select Your Subject")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Access Curriculum/ })
    ).toBeInTheDocument();
  });

  test("renders the admin gear icon", () => {
    const { container } = render(<SubjectDrive />);
    // FontAwesome renders the gear as an <svg>. Its presence is what makes the
    // "view all accounts" entry point reachable.
    expect(container.querySelector("svg")).not.toBeNull();
  });

  test("clicking the gear reveals the Admin link that opens /users", async () => {
    const { container } = render(<SubjectDrive />);

    // Admin menu is hidden until the gear is clicked.
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();

    const gear = container.querySelector("svg");
    await userEvent.click(gear);

    const adminLink = screen.getByText("Admin");
    expect(adminLink).toBeInTheDocument();

    await userEvent.click(adminLink);
    expect(mockNavigate).toHaveBeenCalledWith("/users");
  });
});

describe("no stored subjects", () => {
  test("renders without crashing and shows an empty picker", () => {
    render(<SubjectDrive />);
    // Not a Full Drive user, so the picker is shown but has no options.
    expect(screen.getByText("Select Your Subject")).toBeInTheDocument();
    expect(within(screen.getByRole("combobox")).queryAllByRole("option")).toHaveLength(
      0
    );
  });
});
