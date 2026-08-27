// Unit tests for firebase_auth.js.
//
// firebase_auth.js talks to Firebase Auth + Firestore at module load
// (initializeApp / getAuth) and inside every exported function. We mock the
// whole Firebase SDK so these tests are deterministic and offline: each test
// wires up the return values of the SDK functions it cares about.
import {
  signIn,
  signUp,
  getAllUsers,
  updateUser,
  deleteUser,
} from "./firebase_auth";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({})),
  GoogleAuthProvider: jest.fn(() => ({})),
  signInWithPopup: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
}));

// Helper: build the querySnapshot shape firebase_auth expects from getDocs.
const makeSnapshot = (docs) => ({
  empty: docs.length === 0,
  docs: docs.map((d) => ({
    id: d.id,
    data: () => d.data,
  })),
});

beforeEach(() => {
  jest.clearAllMocks();
  window.alert = jest.fn();
  window.localStorage.clear();
});

describe("signIn", () => {
  test("returns true and stores subjects when the user has subjects", async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: "u1" } });
    getDocs.mockResolvedValue(
      makeSnapshot([{ id: "u1", data: { email: "t@x.com", subject: ["Math 6AB"] } }])
    );

    const result = await signIn("t@x.com", "pw");

    expect(result).toBe(true);
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "t@x.com",
      "pw"
    );
    expect(window.localStorage.getItem("subject")).toBe(
      JSON.stringify(["Math 6AB"])
    );
    expect(window.alert).toHaveBeenCalledWith("Sign in success");
  });

  test("stores Full Drive marker for admin users", async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: "admin" } });
    getDocs.mockResolvedValue(
      makeSnapshot([
        { id: "admin", data: { email: "a@x.com", subject: ["Full Drive"] } },
      ])
    );

    const result = await signIn("a@x.com", "pw");

    expect(result).toBe(true);
    expect(window.localStorage.getItem("subject")).toBe(
      JSON.stringify(["Full Drive"])
    );
  });

  test("returns false and warns when the user has no subjects", async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: "u2" } });
    getDocs.mockResolvedValue(
      makeSnapshot([{ id: "u2", data: { email: "t@x.com", subject: [] } }])
    );

    const result = await signIn("t@x.com", "pw");

    expect(result).toBe(false);
    expect(window.alert).toHaveBeenCalledWith("You don't have any subject");
    expect(window.localStorage.getItem("subject")).toBeNull();
  });

  test("returns false and alerts on bad credentials", async () => {
    signInWithEmailAndPassword.mockRejectedValue(new Error("auth/wrong-password"));

    const result = await signIn("t@x.com", "bad");

    expect(result).toBe(false);
    expect(window.alert).toHaveBeenCalledWith("Check your email or password");
  });
});

describe("signUp", () => {
  test("rejects when email is missing", async () => {
    const result = await signUp({ email: "", password: "pw" });

    expect(result).toBe(false);
    expect(window.alert).toHaveBeenCalledWith("Email is required");
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test("rejects when a user with the email already exists", async () => {
    getDocs.mockResolvedValue(
      makeSnapshot([{ id: "u1", data: { email: "dupe@gmail.com" } }])
    );

    const result = await signUp({ email: "dupe@gmail.com", password: "pw" });

    expect(result).toBe(false);
    expect(window.alert).toHaveBeenCalledWith("User already exists");
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test("creates the auth user and Firestore doc for a new teacher", async () => {
    getDocs.mockResolvedValue(makeSnapshot([]));
    createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: "new1" } });
    setDoc.mockResolvedValue();

    const result = await signUp({
      email: "new@gmail.com",
      password: "pw",
      firstName: "Ada",
      lastName: "Byte",
      role: "teacher",
      subject: "",
      authProvider: "sign-up",
    });

    expect(result).toBe(true);
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "new@gmail.com",
      "pw"
    );
    expect(setDoc).toHaveBeenCalledTimes(1);
    const writtenData = setDoc.mock.calls[0][1];
    expect(writtenData).toEqual(
      expect.objectContaining({
        email: "new@gmail.com",
        firstName: "Ada",
        lastName: "Byte",
        name: "Ada Byte",
        role: "teacher",
      })
    );
    expect(window.alert).toHaveBeenCalledWith("Sign up success");
  });

  test("returns false and reports the error when creation fails", async () => {
    getDocs.mockResolvedValue(makeSnapshot([]));
    createUserWithEmailAndPassword.mockRejectedValue(
      new Error("auth/weak-password")
    );

    const result = await signUp({ email: "new@gmail.com", password: "x" });

    expect(result).toBe(false);
    expect(window.alert).toHaveBeenCalledWith(
      "Sign up failed: auth/weak-password"
    );
  });
});

describe("getAllUsers", () => {
  test("maps Firestore docs to id + data objects", async () => {
    getDocs.mockResolvedValue(
      makeSnapshot([
        { id: "a", data: { email: "a@x.com", role: "admin" } },
        { id: "b", data: { email: "b@x.com", role: "teacher" } },
      ])
    );

    const users = await getAllUsers();

    expect(users).toEqual([
      { id: "a", email: "a@x.com", role: "admin" },
      { id: "b", email: "b@x.com", role: "teacher" },
    ]);
  });
});

describe("updateUser", () => {
  test("calls updateDoc with the provided data", async () => {
    updateDoc.mockResolvedValue();

    await updateUser("u1", { firstName: "Changed" });

    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(updateDoc.mock.calls[0][1]).toEqual({ firstName: "Changed" });
  });
});

describe("deleteUser", () => {
  test("calls deleteDoc for the given id", async () => {
    deleteDoc.mockResolvedValue();

    await deleteUser("u1");

    expect(deleteDoc).toHaveBeenCalledTimes(1);
  });
});

// addDoc is used by the Google sign-in path; silence unused-import lint by
// referencing it in a trivial guard test.
describe("firestore addDoc availability", () => {
  test("addDoc is a mocked function", () => {
    expect(typeof addDoc).toBe("function");
  });
});
