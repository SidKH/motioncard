# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Package manager

Use **pnpm** for installs and scripts (`pnpm install`, `pnpm run …`). Do not use npm or yarn unless the project explicitly documents an exception.

## Code comments

Add comments **only where they carry information the code does not already express**. Prefer explaining *why*: intent, constraints, coupling with another module, timing or workarounds, or anything non-obvious from reading the code alone.

Do **not** add comments that merely restate identifiers, restate control flow, or describe obvious operations. Do **not** add docblocks on self-explanatory helpers or “section header” noise.

When in doubt, omit the comment.

Put each line comment **above** the line it describes, not below it.