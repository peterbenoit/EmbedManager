# CDN + NPM Release Prompt Template

Use this prompt to have Copilot harden and verify a small JS library for npm + CDN delivery.

```text
You are GPT-5.3-Codex acting as my release engineer for a small JavaScript npm library.

Goal:
Make this package safely consumable from CDN (jsDelivr first, also unpkg), sourced from my npm package and GitHub tags/releases.

Repo context:
- Package name: <PACKAGE_NAME>
- GitHub repo: <OWNER>/<REPO>
- Entry file to expose on CDN: <ENTRY_FILE> (example: StorageManager.js)
- Current branch: <BRANCH_NAME>

Do the following end-to-end:

1. Audit and harden package metadata
- Ensure package.json has correct name, version, main, exports, files.
- Add jsdelivr and unpkg fields pointing to the intended browser entry file.
- Keep package minimal; only publish needed runtime files.
- Validate repository, homepage, bugs metadata.

2. Ensure browser compatibility
- Confirm the distributed entry works directly in browser script tag usage.
- Keep Node/CommonJS and browser global compatibility where appropriate.
- Do not break existing API surface unless required; if changed, document clearly.

3. Add release guardrails
- Ensure npm test runs real tests.
- Add a pack dry-run script and a prepublishOnly script that gates publish on tests + pack check.
- Keep scripts simple and non-interactive.

4. CDN readiness checks
- Confirm expected jsDelivr URL pattern for both versioned and latest usage:
  https://cdn.jsdelivr.net/npm/<PACKAGE_NAME>@<VERSION>/<ENTRY_FILE>
  https://cdn.jsdelivr.net/npm/<PACKAGE_NAME>/<ENTRY_FILE>
- Confirm expected unpkg URL pattern:
  https://unpkg.com/<PACKAGE_NAME>@<VERSION>/<ENTRY_FILE>
- Verify that files needed by CDN are actually included by npm pack.

5. Documentation updates
- Add a short CDN Usage section in README with copy/paste script tags for pinned and latest versions.
- Add a short Release Steps section with exact commands from version bump through publish.
- Keep docs concise and accurate to actual scripts in package.json.
- Update any associated website documentation to include CDN and NPM info (if necessary)

6. Git and safety behavior
- First show git status and summarize blockers (dirty tree, untracked files, missing ignores).
- If the tree is dirty, stop and ask before committing or tagging.
- Never run destructive git commands.
- Do not publish automatically unless I explicitly say: PUBLISH NOW.

7. Verification and output format
- Run tests and pack dry-run.
- Provide a final release-readiness report with:
  - What changed
  - Any risks
  - Exact CDN URLs that should work after publish
  - Exact next commands I should run

Acceptance criteria:
- npm test passes
- npm pack --dry-run includes only intended files
- README has working CDN examples
- package.json is correctly configured for jsDelivr/unpkg
- No destructive git actions taken
```
