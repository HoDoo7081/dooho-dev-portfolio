# Optional integrations

## Local-only / manual mode

Node.js 24+ is sufficient. `npm start` creates a new, private local data directory. No credentials are bundled. Use only synthetic data when evaluating the example. The tests do not contact external services.

## AI API

Copy `.env.example` to `.env.local` and supply your own key only if you want the optional API path. The app sends the selected source and context when you explicitly request analysis. `store:false` is set, but this is not a guarantee about every provider retention policy. Manual chat import remains available without an API key.

## Notion

This version intentionally removes the author's database, data-source and template IDs. Notion integration is optional and requires your own compatible Projects & Tasks template:

1. Create a Projects database with a title property named **Project name**.
2. Create a Tasks database with **Task name** (title), **Project** (relation to Projects) and **Status** (status values **Not Started** and **Done**).
3. Create a project template with the heading-2 sections **About this project**, **Project Brief**, **Communication Log**, **Change Review**, **POC Plan**, **Project Timeline**, and **Decision Log & Handover**. Include a child database in the template; the current readiness check expects one.
4. Set the four `NOTION_*` IDs from your own databases, data sources and template in `.env.local`, and restart the app. A database ID and data-source ID are different.
5. Create an internal Notion integration, grant it access to both databases and the template, then enter its token in the app's Settings & Connections. The token is kept in the ignored local connection file.
6. Use synthetic inputs to verify the structure before relying on synchronization.

Writes happen after the explicit approval/apply step when connected, and subsequent changes use the explicit sync action. Approved source excerpts may be sent to Notion; the whole transcript is not copied as a separate raw transcript document.

This repository does not create or share a hosted Notion workspace for visitors. It does not automatically read Notion edits back into the app.

## Data handling

Inputs, proposals, approved facts and history are stored in local SQLite. They are not encrypted at rest. Bind address is 127.0.0.1; this is not a production multi-user service. Environment files, local databases, connection files and generated evidence exports must not be committed. See the root project `.gitignore`.

