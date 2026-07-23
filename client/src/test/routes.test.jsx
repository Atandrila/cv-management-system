import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AppRoutes from "../routes/AppRoutes";
import { AuthContext } from "../contexts/AuthContext";
import { PreferencesProvider } from "../contexts/PreferencesContext";

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));
vi.mock("../api/client", () => ({
  api: apiMock,
  apiEnvelope: apiMock,
  json: (method, body) => ({ method, body: JSON.stringify(body) }),
}));

const attribute = { id: "a1", name: "Professional Summary", description: "Summary", category: "EXPERIENCE", type: "TEXT", isBuiltIn: false, version: 1, usageCount: 1, options: [] };
const position = { id: "p1", title: "Business Analyst", description: "Analyze requirements", company: "Northstar", level: "MIDDLE", isPublic: true, maxProjects: 3, version: 1, attributes: [{ attributeId: "a1", sortOrder: 0, required: true, attribute }], accessRules: [], tags: [], _count: { cvs: 1, posts: 0 } };
const cvRow = { id: "cv1", status: "PUBLISHED", updatedAt: new Date().toISOString(), user: { id: "candidate", email: "candidate@demo.local", firstName: "Amina", lastName: "Rahman" }, position, _count: { likes: 0 } };
const profile = { id: "candidate", email: "candidate@demo.local", firstName: "Amina", lastName: "Rahman", location: "Dhaka", photoUrl: null, preferredLanguage: "EN", preferredTheme: "LIGHT", version: 1, roles: ["CANDIDATE"], attributeValues: [{ id: "v1", attributeId: "a1", value: "Experienced analyst", version: 1, attribute }], projects: [], cvs: [cvRow] };
const hydratedCv = { ...cvRow, userId: "candidate", positionId: "p1", version: 1, publishedAt: new Date().toISOString(), projects: [], likes: [], values: [{ attribute, required: true, value: "Experienced analyst", version: 1 }], likeCount: 0, likedByMe: false, canEdit: false };

function responseFor(path) {
  if (path === "/dashboard") return { latest: [position], popular: [position], tags: [], stats: { positions: 1, candidates: 1, recruiters: 1, submitted: 1, recentCvs: 1 } };
  if (path === "/positions") return [position];
  if (path.startsWith("/positions?") || path.startsWith("/positions?q=")) return [position];
  if (path === "/positions/p1") return position;
  if (path.startsWith("/attributes")) return [attribute];
  if (path.startsWith("/profile")) return profile;
  if (path === "/cvs") return [cvRow];
  if (path.startsWith("/cvs?")) return [cvRow];
  if (path === "/cvs/cv1") return hydratedCv;
  if (path.startsWith("/search?")) return { positions: [position], cvs: [cvRow], users: [] };
  if (path === "/users") return [{ ...profile, isBlocked: false, roles: ["CANDIDATE"] }];
  if (path === "/users/candidate/public") return { id: "candidate", firstName: "Amina", lastName: "Rahman", location: "Dhaka", photoUrl: null, cvs: [cvRow] };
  if (path === "/positions/p1/posts") return [];
  return [];
}

function userFor(role) {
  if (!role) return null;
  return { id: role.toLowerCase(), email: `${role.toLowerCase()}@demo.local`, firstName: role, lastName: "Demo", roles: [role], preferredLanguage: "EN", preferredTheme: "LIGHT", version: 1 };
}

function renderRoute(route, role, authOverrides = {}) {
  const user = userFor(role);
  return render(
    <AuthContext.Provider value={{ user, setUser: vi.fn(), loading: false, authError: "", oauthAvailability: {}, demoLoginAvailable: false, evaluationLoginAvailable: false, isAuthenticated: Boolean(user), loginWith: vi.fn(), demoLogin: vi.fn(), evaluationLogin: vi.fn(), logout: vi.fn(), refreshUser: vi.fn(), ...authOverrides }}>
      <PreferencesProvider>
        <MemoryRouter initialEntries={[route]}><AppRoutes /></MemoryRouter>
      </PreferencesProvider>
    </AuthContext.Provider>,
  );
}

describe("all application routes", () => {
  it.each([
    ["/", null, "One profile. Every opportunity."],
    ["/login", null, "Sign in to your workspace"],
    ["/unauthorized", null, "Access denied"],
    ["/missing-page", null, "Page not found"],
    ["/positions", null, "Positions"],
    ["/positions/p1", "RECRUITER", "Business Analyst"],
    ["/search?q=Business", "RECRUITER", "Search results"],
    ["/profile", "CANDIDATE", "Amina Rahman"],
    ["/cvs", "CANDIDATE", "My CVs"],
    ["/cvs/cv1", "RECRUITER", "Amina Rahman"],
    ["/public-profile/candidate", "RECRUITER", "Amina Rahman"],
    ["/attributes", "RECRUITER", "Attribute Library"],
    ["/positions/new", "RECRUITER", "Create position"],
    ["/positions/p1/edit", "RECRUITER", "Edit position"],
    ["/admin/users", "ADMIN", "User Management"],
    ["/admin/users/candidate/profile", "ADMIN", "Amina Rahman"],
  ])("renders %s for %s", async (route, role, heading) => {
    localStorage.setItem("cv-language", "EN");
    apiMock.mockImplementation((path) => Promise.resolve(responseFor(path)));
    renderRoute(route, role);
    expect(await screen.findByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it("renders valid Bengali navigation text when Bengali is selected", async () => {
    localStorage.setItem("cv-language", "BN");
    apiMock.mockImplementation((path) => Promise.resolve(responseFor(path)));
    renderRoute("/positions", null);
    expect(await screen.findByRole("link", { name: "হোম" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "পদসমূহ" })).toBeInTheDocument();
  });

  it("shows the credential form only when evaluator access is enabled", async () => {
    localStorage.setItem("cv-language", "EN");
    renderRoute("/login", null, { evaluationLoginAvailable: true });
    expect(await screen.findByRole("heading", { name: "Sign in to your workspace" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in as evaluator" })).toBeInTheDocument();
  });
});
