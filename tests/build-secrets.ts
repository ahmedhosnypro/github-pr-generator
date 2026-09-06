// Regression guard for the build-time secrets strip (scripts/strip-config.ts).
// If someone adds a new credential field to config.local.json without teaching the
// stripper about it, these tests must fail before the leak ships into dist/.
import { SECRET_CONFIG_FIELDS, sanitizeConfig } from "../scripts/strip-config";
import { expectMatch, getFailures } from "./expect-helpers";

console.log("=== Build Secrets Strip Tests ===\n");

// Known secret fields are stripped; non-secret fields pass through untouched.
const config = {
  apiEndpoint: "http://localhost:20128/v1",
  apiKey: "sk-real-key",
  githubToken: "ghp_real-token",
  model: "model_id",
  diffEnabled: true,
  diffMaxLines: 5000,
  testPr: { owner: "facebook", repo: "react", number: 37382 },
};
const { sanitized, stripped } = sanitizeConfig(config);
expectMatch("apiKey removed", "apiKey" in sanitized, false);
expectMatch("githubToken removed", "githubToken" in sanitized, false);
expectMatch("apiEndpoint kept", sanitized.apiEndpoint, "http://localhost:20128/v1");
expectMatch("model kept", sanitized.model, "model_id");
expectMatch("boolean kept", sanitized.diffEnabled, true);
expectMatch("number kept", sanitized.diffMaxLines, 5000);
expectMatch("nested object kept", JSON.stringify(sanitized.testPr), JSON.stringify(config.testPr));

// Stripped list names the keys that held real values, so the build can warn.
expectMatch("stripped lists apiKey", stripped.includes("apiKey"), true);
expectMatch("stripped lists githubToken", stripped.includes("githubToken"), true);

// Empty secret values are still removed from the artifact, just not reported.
const blank = sanitizeConfig({ apiKey: "", githubToken: "", model: "m" });
expectMatch("empty apiKey still removed", "apiKey" in blank.sanitized, false);
expectMatch("empty githubToken still removed", "githubToken" in blank.sanitized, false);
expectMatch("empty secrets not reported as stripped", blank.stripped.length, 0);

// Future/unknown credential-looking keys must be stripped without a denylist update.
const future = sanitizeConfig({
  anthropicKey: "sk-ant-x",
  apiKey2: "sk-second",
  openaiToken: "tok",
  clientSecret: "shh",
  dbPassword: "pw",
  model: "model_id",
});
expectMatch("anthropicKey stripped by pattern", "anthropicKey" in future.sanitized, false);
expectMatch("apiKey2 stripped by pattern", "apiKey2" in future.sanitized, false);
expectMatch("openaiToken stripped by pattern", "openaiToken" in future.sanitized, false);
expectMatch("clientSecret stripped by pattern", "clientSecret" in future.sanitized, false);
expectMatch("dbPassword stripped by pattern", "dbPassword" in future.sanitized, false);
expectMatch("non-secret key survives pattern", future.sanitized.model, "model_id");

// Fail-closed: non-object JSON (array / scalar / null) sanitizes to an empty config.
expectMatch("array input yields empty config", Object.keys(sanitizeConfig([]).sanitized).length, 0);
expectMatch("null input yields empty config", Object.keys(sanitizeConfig(null).sanitized).length, 0);
expectMatch("string input yields empty config", Object.keys(sanitizeConfig("nope").sanitized).length, 0);

// The credential-pattern check is case-insensitive across the whole key name.
const mixedCase = sanitizeConfig({ APIKEY: "x", MonKey: "y", "GitHub-Token": "z", MY_SECRET: "s", model: "model_id" });
expectMatch("uppercase KEY stripped", "APIKEY" in mixedCase.sanitized, false);
expectMatch("mixed-case key stripped", "MonKey" in mixedCase.sanitized, false);
expectMatch("token-suffixed key stripped", "GitHub-Token" in mixedCase.sanitized, false);
expectMatch("secret-suffixed key stripped", "MY_SECRET" in mixedCase.sanitized, false);

// Secret-look-alike keys with non-string values carry no real credential, so they
// are dropped from the artifact but not reported in the stripped list.
const nonString = sanitizeConfig({ apiKey: 12345, model: "model_id" });
expectMatch("non-string apiKey removed", "apiKey" in nonString.sanitized, false);
expectMatch("non-string secret not reported as stripped", nonString.stripped.includes("apiKey"), false);

// Lab override fields (tests/pr-lab-run.ts) are not credentials and must survive.
const labs = sanitizeConfig({ labModel: "fast-model", labEffort: "low", model: "model_id" });
expectMatch("labModel kept", labs.sanitized.labModel, "fast-model");
expectMatch("labEffort kept", labs.sanitized.labEffort, "low");

// The denylist itself must stay non-empty and cover the two known secrets.
expectMatch("denylist covers apiKey", (SECRET_CONFIG_FIELDS as readonly string[]).includes("apiKey"), true);
expectMatch("denylist covers githubToken", (SECRET_CONFIG_FIELDS as readonly string[]).includes("githubToken"), true);

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All build-secrets tests passed");
