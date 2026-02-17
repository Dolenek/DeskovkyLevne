FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/api ./cmd/server

FROM alpine:3.21
WORKDIR /app
RUN adduser -D appuser
COPY --from=builder /out/api /app/api
USER appuser
EXPOSE 8080
ENTRYPOINT ["/app/api"]
