# Backend Working Rules

This project is a Node.js backend using Express, CommonJS, Prisma, JWT, bcrypt, Cloudinary, dotenv, and existing AI provider SDKs.

Use these rules as the default guide when changing backend code.

---

## 1. Main principles

- Make the smallest change that correctly solves the current task.
- Do not refactor unrelated code.
- Preserve existing behavior unless the task clearly requires changing it.
- Prefer simple, explicit, maintainable code over clever abstractions.
- Keep routes, controllers, services, validation, database access, middleware, and utilities focused on one responsibility.
- Follow existing project patterns before introducing new ones.
- Reuse existing code before creating new abstractions.
- Do not add dependencies without explicit approval.
- Do not change unrelated formatting.
- Do not remove working code without a clear reason.

---

## 2. Reuse before creation

Before creating a new route, controller, service, middleware, Prisma helper, validation helper, utility, constant, authentication helper, or provider wrapper:

1. Search the existing codebase for an equivalent or similar implementation.
2. Reuse or extend existing code when appropriate.
3. Create something new only when no suitable implementation exists.

Do not duplicate business logic, authentication checks, provider clients, database helpers, constants, or validation logic unnecessarily.

---

## 3. Project stack

Use the existing stack:

- Node.js
- Express
- CommonJS
- Prisma
- JSON Web Tokens
- bcrypt
- dotenv
- Cloudinary
- Existing AI provider SDKs

Do not introduce competing frameworks, ORMs, authentication libraries, validation libraries, upload providers, or AI providers without explicit approval.

Follow the existing CommonJS style unless the project intentionally migrates to another module system.

---

## 4. Responsibility boundaries

### Routes

- Routes should define endpoints and middleware chains.
- Keep route files thin.
- Do not place substantial business logic in route definitions.
- Do not place direct Prisma operations in route files unless that is already the established project pattern and the change is trivial.

### Controllers

- Controllers should handle HTTP concerns.
- Controllers may read `req.body`, `req.params`, `req.query`, and authenticated request context.
- Controllers should choose status codes and shape responses.
- Avoid putting complex business rules in controllers.

### Services

- Services should contain business logic.
- Services should receive plain values or objects.
- Services should return plain values or throw/return known application errors.
- Do not pass Express `req` or `res` objects into services.
- Keep services independent from HTTP details when practical.

### Database access

- Keep Prisma queries close to the service or domain use case that owns them.
- Do not introduce a repository/data-access layer unless the project already uses one or there is a demonstrated repeated need.

---

## 5. API design

- Keep request and response shapes predictable.
- Validate required input before using it.
- Normalize input only when the behavior is intentional.
- Return clear and consistent HTTP status codes.
- Use user-safe error messages.
- Preserve existing endpoint behavior unless the task requires a change.
- Do not expose internal implementation details.

Never expose stack traces, password hashes, JWTs, API keys, provider secrets, sensitive raw provider responses, internal database details, or internal filesystem paths.

---

## 6. HTTP status codes

Use status codes consistently unless the project intentionally follows a different convention.

- `200` for successful reads and updates.
- `201` for successful resource creation.
- `204` only when intentionally returning no response body.
- `400` for invalid request input.
- `401` when authentication is missing or invalid.
- `403` when the authenticated user does not have permission.
- `404` when the requested resource does not exist.
- `409` for known resource conflicts when appropriate.
- `500` for unexpected internal failures.

Do not change existing endpoint status codes only for stylistic consistency unless the task requires it.

---

## 7. Authentication and authorization

Authentication and authorization are separate concerns.

- Authentication verifies who the user is.
- Authorization verifies what that user is allowed to access or modify.
- Never assume that a valid JWT grants permission to any resource.
- Verify ownership and permissions before reading, updating, or deleting user-owned data.
- Use trusted authenticated user context for ownership checks.
- Never use a user ID from `req.body`, `req.params`, or `req.query` as proof of ownership by itself.
- Reuse the project's existing authentication middleware and helpers.
- Do not duplicate JWT verification logic across endpoints.

---

## 8. JWT safety

- Verify JWT signatures using the project's existing auth boundary.
- Do not decode a JWT as a substitute for verification.
- Do not trust claims from an unverified token.
- Do not expose JWT contents unnecessarily.
- Do not log JWTs.
- Do not hardcode JWT secrets.
- Keep JWT secrets and related configuration in environment variables.
- Follow the project's existing token expiration and refresh strategy.

---

## 9. Password and bcrypt safety

- Hash passwords with bcrypt before storing them.
- Use `bcrypt.compare` for password verification.
- Never compare plaintext passwords manually.
- Never return password hashes in API responses.
- Never log plaintext passwords or password hashes.
- Do not re-hash an already hashed password.
- Reuse the project's existing bcrypt configuration or salt-round convention.

---

## 10. Input validation

Treat all external input as untrusted, including request bodies, params, query strings, headers, uploaded files, external API responses, Cloudinary responses, and AI provider responses.

- Validate required fields before service or database calls.
- Validate expected types and formats.
- Reject malformed or unexpected values when necessary.
- Keep validation rules aligned with frontend and product rules when those rules are known.
- Avoid trusting client-provided IDs without permission checks.
- Do not silently coerce invalid data unless intentional and consistent with existing behavior.

---

## 11. Database writes and mass-assignment safety

Never pass the entire request body directly into Prisma.

Wrong:

```js
await prisma.user.update({
  where: { id },
  data: req.body,
});
```

Instead, explicitly select allowed fields:

```js
await prisma.user.update({
  where: { id },
  data: {
    name: req.body.name,
    avatar: req.body.avatar,
  },
});
```

Rules:

- Explicitly choose which client-provided fields may be created or updated.
- Do not let clients set protected fields unless explicitly authorized.
- Protected fields may include ownership IDs, roles, permissions, verification flags, internal statuses, billing flags, and administrative fields.
- Validate values before database writes.

---

## 12. Prisma client usage

- Reuse the project's existing Prisma Client instance.
- Do not create a new `PrismaClient` per request.
- Do not create unnecessary Prisma Client instances in services or controllers.
- Follow the existing Prisma initialization pattern.
- Use Prisma Client instead of raw SQL unless there is a clear, justified reason.

---

## 13. Prisma queries

- Select only the fields needed when practical.
- Avoid returning sensitive columns.
- Handle missing records explicitly.
- Avoid large unnecessary `include` graphs.
- Keep reads and writes intentional and easy to review.
- Be careful with cascading deletes.
- Be careful with multi-record updates and deletes.
- Avoid unnecessary database round trips when a simple Prisma query can safely handle the use case.
- Preserve existing transaction and consistency behavior unless intentionally changing it.

---

## 14. Prisma transactions

Use transactions when multiple related database writes must succeed or fail together.

Examples include creating a record and its dependent records, changing balances or counters across multiple records, replacing related data, or performing several required database writes as one unit.

- Prefer Prisma transactions for atomic database operations.
- Do not use transactions unnecessarily for a single independent query.
- Keep transaction scope as small as practical.
- Avoid slow external network calls inside database transactions when possible.

---

## 15. Destructive database operations

Be especially careful with `delete`, `deleteMany`, `updateMany`, cascading deletes, ownership transfers, and bulk mutations.

Before destructive operations:

1. Verify the filter.
2. Verify ownership or permissions.
3. Confirm the operation targets only the intended records.
4. Preserve existing safety checks.

Never execute an unfiltered destructive bulk operation unless it is explicitly required and clearly intentional.

---

## 16. Error handling

- Do not silently swallow errors.
- Do not use empty `catch` blocks.
- Handle expected failures with clear responses.
- Keep internal error details out of client responses.
- Avoid broad catch blocks that hide actionable failures.
- Log only safe operational context when logging is necessary.
- Remove temporary debug logs before finishing.

---

## 17. Expected vs unexpected errors

Distinguish between expected application errors and unexpected internal errors.

Expected errors may include invalid input, unauthorized access, forbidden access, missing records, and known conflicts.

Unexpected errors include programming errors, database failures, unexpected provider failures, and runtime exceptions.

- Expected application errors may return specific `4xx` responses.
- Unexpected errors should normally return a generic `500` response.
- Do not send `error.message` directly to clients unless it is explicitly known to be user-safe.
- Do not expose Prisma, provider, or stack-trace details to clients.

---

## 18. Logging

- Never log passwords.
- Never log JWTs.
- Never log API keys.
- Never log secrets.
- Never log sensitive user data unless there is a clearly approved operational need.
- Do not log raw AI prompts when they may contain sensitive information.
- Do not log raw provider payloads when they may contain secrets or user data.
- Prefer concise, safe operational context.
- Remove temporary `console.log` statements before finishing.

---

## 19. Environment configuration

- Use environment variables for configuration and credentials.
- Reuse the project's existing `dotenv` and configuration pattern.
- Never hardcode secrets.
- Never commit actual secret values.
- Validate required environment variables at startup when practical and consistent with the existing project.
- Do not silently fall back to insecure production defaults.
- Do not expose server-only environment variables to clients.

---

## 20. Cloudinary and media handling

- Reuse the project's existing Cloudinary configuration.
- Keep Cloudinary credentials in environment variables.
- Never expose Cloudinary secrets.
- Validate file type, size, and expected upload context when practical.
- Verify ownership before replacing or deleting user-owned media.
- Be careful to avoid orphaned media when related database operations fail.
- Do not trust client-provided Cloudinary public IDs without authorization checks.
- Keep media deletion and replacement logic intentional and easy to review.

---

## 21. External services

- Treat external service responses as untrusted input.
- Handle failures, timeouts, malformed responses, empty responses, and partial responses.
- Keep provider-specific logic isolated when practical.
- Reuse existing provider clients and wrappers.
- Do not add or switch external providers without explicit approval.
- Do not expose provider-specific internal errors directly to API clients.

---

## 22. AI provider safety

Use existing AI provider SDKs only when the task requires AI behavior.

- Keep provider keys and configuration in environment variables.
- Do not log raw prompts when they may contain sensitive data.
- Do not log tokens, API keys, or sensitive provider payloads.
- Handle provider failures, timeouts, empty responses, and malformed responses.
- Keep provider-specific code isolated when practical.
- Do not add or switch providers without explicit approval.
- Treat AI output as untrusted external input.
- Validate structured AI responses before using or storing them.
- Do not assume AI-generated JSON matches the expected schema.
- Do not execute code, shell commands, URLs, database operations, or privileged actions directly from model output.
- Keep user-controlled content clearly separated from trusted server-side instructions when constructing prompts.
- Do not let user-controlled prompt content override trusted server-side instructions.

---

## 23. AI structured output

When an AI provider is expected to return structured data:

- Validate the shape before using it.
- Reject or handle malformed output safely.
- Do not cast an unchecked provider response into a trusted application shape.
- Use the project's existing parsing or validation approach when one exists.
- Do not write malformed AI output directly to the database.

---

## 24. Security

- Never hardcode secrets.
- Never expose credentials.
- Never trust client-controlled ownership fields.
- Never expose internal errors unnecessarily.
- Never bypass existing authentication or authorization middleware for convenience.
- Never disable security checks just to make a feature work.
- Validate external data before performing privileged operations.
- Prefer deny-by-default behavior for sensitive actions when permission state is unclear.

---

## 25. Shared code safety

When modifying shared middleware, authentication helpers, services, Prisma helpers, provider wrappers, utilities, or shared constants:

1. Search for existing usages.
2. Consider every affected endpoint or consumer.
3. Preserve backwards compatibility unless the task requires a breaking change.
4. Verify at least one existing consumer in addition to the new or changed behavior.
5. Avoid changing a shared API only to simplify one isolated use case.

Be especially careful with authentication, authorization, database access, and provider integrations.

---

## 26. Naming and style

- Use clear `camelCase` names for variables and functions.
- Use descriptive names over abbreviations.
- Keep functions small enough to understand quickly.
- Prefer early returns and guard clauses for invalid input.
- Follow the existing CommonJS style.
- Follow the existing file naming conventions.
- Prefer explicit names over generic names such as `data`, `result`, or `item` when a more meaningful name is available.

Prefer:

```js
authenticatedUser
createdSubscription
cloudinaryUploadResult
```

over:

```js
usr
resData
obj
```

---

## 27. Dependencies

Before suggesting or adding a dependency:

1. Check whether the project already has an equivalent solution.
2. Prefer existing project dependencies.
3. Confirm the dependency is actually needed.
4. Avoid adding large packages for trivial functionality.
5. Consider maintenance and security implications.

- Do not install or add a dependency without explicit approval.
- Do not replace an existing library with a competing library unless explicitly requested.
- Do not introduce a new validation, auth, ORM, upload, or AI library only for convenience.

---

## 28. Quality checks

Before editing:

1. Identify the exact backend area affected.
2. Inspect related routes, controllers, services, middleware, and database logic.
3. Search for existing reusable implementations.
4. Identify the likely bug cause or required behavior.
5. Choose the smallest safe change.
6. Identify how the change will be verified.

Do not make speculative fixes when the relevant implementation can be inspected.

After editing:

1. Review every changed file.
2. Remove unused code.
3. Remove temporary code.
4. Remove debug logs.
5. Remove commented-out experiments.
6. Check for accidental changes.
7. Verify authentication and permission implications.
8. Verify database write safety.
9. Verify error handling.
10. Run relevant project checks when available.
11. Confirm unrelated behavior was not modified.

---

## 29. Commands and verification

Check `package.json` before running or suggesting commands.

Available scripts are currently:

```bash
npm run dev
npm start
npm test
```

- Do not invent lint, typecheck, build, or test commands that are not defined.
- Prefer the package manager already used by the repository.
- If `npm test` contains a placeholder failing script, do not use it as proof of correctness.
- Verify changed behavior manually or with the closest available command.
- If a relevant automated check cannot be run, explain why.

---

## 30. Bug-fix verification

For bug fixes:

- Reproduce or understand the broken behavior before changing code when practical.
- Verify the expected fixed behavior.
- Check at least one relevant failure or edge case.
- Confirm the fix does not weaken authentication, authorization, validation, or database safety.

---

## 31. Feature verification

For features:

- Verify the main happy path.
- Verify at least one relevant invalid-input path.
- Verify authentication or authorization behavior when applicable.
- Verify missing-record behavior when applicable.
- Verify external provider failure behavior when applicable.
- Verify no sensitive data is exposed.

---

## 32. Collaboration rules for AI changes

Before editing:

- Identify the exact backend area affected.
- Inspect existing patterns before creating new code.
- Understand the relevant implementation before modifying it.
- Follow the minimum-change approach.
- Do not modify frontend files from this backend context unless explicitly requested.

During editing:

- Do not perform opportunistic refactors.
- Do not change unrelated formatting.
- Do not add dependencies without explicit approval.
- Do not bypass existing security checks.
- Do not duplicate existing abstractions.
- Do not invent APIs, environment variables, package scripts, files, or conventions that have not been verified.

After editing, summarize:

- changed files,
- what changed,
- verification performed,
- remaining risks,
- assumptions made.

---

## 33. Preferred AI behavior

When uncertain:

- Inspect more of the existing project instead of guessing.
- Prefer consistency with the current codebase over personal preference.
- Reuse existing implementations before creating new ones.
- Choose the least invasive safe solution.
- Do not assume package scripts, directory structures, APIs, environment variables, or conventions that have not been verified.
- Ask for clarification only when the ambiguity materially changes the implementation.
- Keep explanations concise and focused on the requested backend change.

---

## 34. Do not

- Do not pass `req.body` directly into Prisma writes.
- Do not create a new Prisma Client per request or service.
- Do not treat authentication as authorization.
- Do not trust client-provided ownership IDs.
- Do not return raw unexpected `error.message` values to clients.
- Do not expose stack traces.
- Do not log secrets, JWTs, passwords, or sensitive provider data.
- Do not decode JWTs instead of verifying them.
- Do not return password hashes.
- Do not bypass ownership checks.
- Do not silently swallow errors.
- Do not execute privileged actions directly from AI-generated output.
- Do not trust AI-generated JSON without validation.
- Do not add dependencies without approval.
- Do not modify unrelated files.
- Do not leave debug logs or temporary code.
