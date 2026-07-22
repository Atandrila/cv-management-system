import "dotenv/config";

const providers = [
  { name: "GitHub", id: "GITHUB_CLIENT_ID", secret: "GITHUB_CLIENT_SECRET", callback: "GITHUB_CALLBACK_URL", expected: "http://localhost:5000/api/auth/github/callback" },
  { name: "Google", id: "GOOGLE_CLIENT_ID", secret: "GOOGLE_CLIENT_SECRET", callback: "GOOGLE_CALLBACK_URL", expected: "http://localhost:5000/api/auth/google/callback" },
];

let ready = true;
for (const provider of providers) {
  const id = process.env[provider.id]?.trim();
  const secret = process.env[provider.secret]?.trim();
  const callback = process.env[provider.callback]?.trim() || provider.expected;
  const configured = Boolean(id && secret && !/your-|replace-with/i.test(id + secret));
  const callbackMatches = callback === provider.expected;
  ready &&= configured && callbackMatches;
  console.log(`${provider.name}: ${configured ? "credentials configured" : "MISSING credentials"}`);
  console.log(`  callback: ${callback}${callbackMatches ? "" : ` (expected ${provider.expected})`}`);
}
console.log(`Application URL: ${process.env.APP_URL || "http://localhost:5000"}`);
if (!ready) {
  console.log("OAuth setup is incomplete. See the Optional social login section in README.md.");
  process.exitCode = 1;
} else {
  console.log("Both OAuth providers are configured.");
}
