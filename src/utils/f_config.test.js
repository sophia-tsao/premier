// Unit tests for static configuration data in f_config.js.
// These are pure-data assertions: no Firebase or network access is involved,
// so they run fast and never flake.
import { firebaseConfig, driveLink } from "./f_config";

describe("firebaseConfig", () => {
  test("exposes all required Firebase fields", () => {
    expect(firebaseConfig).toEqual(
      expect.objectContaining({
        apiKey: expect.any(String),
        authDomain: expect.any(String),
        projectId: expect.any(String),
        storageBucket: expect.any(String),
        messagingSenderId: expect.any(String),
        appId: expect.any(String),
      })
    );
  });

  test("points at the premier-portal project", () => {
    expect(firebaseConfig.projectId).toBe("premier-portal-1add0");
  });
});

describe("driveLink map", () => {
  test("is a non-empty object of subject -> URL", () => {
    const entries = Object.entries(driveLink);
    expect(entries.length).toBeGreaterThan(100);
    for (const [subject, url] of entries) {
      expect(typeof subject).toBe("string");
      expect(url).toMatch(/^https:\/\/drive\.google\.com\/drive\/folders\//);
    }
  });

  test("contains representative subjects across grade bands", () => {
    expect(driveLink).toHaveProperty("1st Grade");
    expect(driveLink).toHaveProperty("Math 6AB");
    expect(driveLink).toHaveProperty("AP Calculus BC");
  });

  test("does not contain a 'Full Drive' key (admins open the picker, not a single link)", () => {
    // "Full Drive" is the admin marker in the subject array, not a real Drive
    // link. SubjectDrive treats it specially and must never look it up here.
    expect(driveLink).not.toHaveProperty("Full Drive");
  });
});
