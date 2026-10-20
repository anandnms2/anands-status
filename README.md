# Anands Status

Branded [Beszel](https://github.com/henrygd/beszel) monitoring hub for status.anands.xyz.
Orange / black / grey theme, Anands "A" logo, favicons, PWA icons, "Anands Status" naming.

## How it works
Beszel compiles its web UI into the Go binary, so you cannot theme the official image from outside.
The Dockerfile clones Beszel at a pinned tag (`BESZEL_REF`), runs `scripts/apply-brand.mjs`
(copies `brand/` assets, rewrites titles, appends `brand/theme.css`), builds the UI, then builds the hub.
Every patch asserts it matched, so an upstream change fails the build instead of shipping half-branded.

## Deploy (keeps your data)
1. Push to `anandnms2/anands-status`; the workflow builds `ghcr.io/anandnms2/anands-status:latest`
   (set the package to public, or add GHCR credentials in Coolify).
2. Coolify > service "Anands Status" > Edit Compose: change only the `image:` of the `beszel` container
   (not `beszel-agent`) from `henrygd/beszel:latest` to `ghcr.io/anandnms2/anands-status:latest`.
   Leave the `beszel-data` and `beszel-socket` volumes, env and domain untouched.
3. Save and Deploy. Hard-refresh the browser (and reinstall the PWA to get the new icon).
4. Rollback: set `image:` back to `henrygd/beszel:latest`.

## Upgrading Beszel (automated weekly; manual steps below)
Run the workflow manually with `beszel_ref` set to the new tag, or change the default in
`Dockerfile` and `build.yml`. Keep the agent image on the same version.

## Not changed on purpose
Data directory (`beszel_data`), API routes, the `beszel-agent` image and the install snippets
the "Add system" dialog generates; changing those would break existing agents.

Each build is tagged `:latest` and `:<beszel version>` (for example `:v0.21.0`), so you can roll back
by pointing the compose `image:` at an older version tag.
