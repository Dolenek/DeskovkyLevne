FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
ARG API_VERSION=development
ARG API_COMMIT=unknown
ARG API_BUILT_AT=unknown
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
  -ldflags "-X main.version=${API_VERSION} -X main.commit=${API_COMMIT} -X main.builtAt=${API_BUILT_AT}" \
  -o /out/api ./cmd/server

FROM alpine:3.21
WORKDIR /app
RUN adduser -D appuser
COPY --from=builder /out/api /app/api
USER appuser
EXPOSE 8080
ENTRYPOINT ["/app/api"]
