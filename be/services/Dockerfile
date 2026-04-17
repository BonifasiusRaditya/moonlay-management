FROM golang:1.22.2 AS build-stage

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . .

ARG CMD_PATH=ra-service

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /go-binary ./cmd/${CMD_PATH}

FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /
COPY --from=build-stage /go-binary /go-binary

ENTRYPOINT ["/go-binary"]
