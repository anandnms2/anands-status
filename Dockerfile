# syntax=docker/dockerfile:1
# Anands Status = Beszel hub built from source with Anands branding applied.
# Beszel embeds its web UI in the Go binary, so branding must happen before the build.
ARG BESZEL_REF=v0.21.0

# ---- 1. Fetch upstream source at a pinned tag ----
FROM alpine/git AS src
ARG BESZEL_REF
RUN git clone --depth 1 --branch "${BESZEL_REF}" https://github.com/henrygd/beszel /src

# ---- 2. Apply branding and build the web UI ----
FROM node:24-alpine AS web
RUN npm install -g bun
WORKDIR /src
COPY --from=src /src /src
COPY brand /brand
COPY scripts /scripts
RUN node /scripts/apply-brand.mjs /src /brand
WORKDIR /src/internal/site
RUN bun install --frozen-lockfile || bun install
RUN bun run build

# ---- 3. Build the hub binary with the branded UI embedded ----
FROM --platform=$BUILDPLATFORM golang:alpine AS hub
WORKDIR /app
COPY --from=src /src/go.mod /src/go.sum ./
RUN go mod download
COPY --from=src /src /app
COPY --from=web /src/internal/site/dist /app/internal/site/dist
RUN apk add --no-cache ca-certificates && update-ca-certificates
ARG TARGETOS TARGETARCH
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -ldflags "-w -s" -o /beszel ./internal/cmd/hub

# ---- 4. Final image (same layout as upstream henrygd/beszel) ----
FROM scratch
LABEL org.opencontainers.image.title="Anands Status" \
      org.opencontainers.image.description="Anands Status: branded Beszel monitoring hub" \
      org.opencontainers.image.source="https://github.com/anandnms2/anands-status"
COPY --from=hub /beszel /
COPY --from=hub /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
VOLUME ["/beszel_data"]
EXPOSE 8090
ENTRYPOINT [ "/beszel" ]
CMD ["serve", "--http=0.0.0.0:8090"]
