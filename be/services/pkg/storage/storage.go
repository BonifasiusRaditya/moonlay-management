package storage

import (
	"context"
	"time"
)

type PresignResult struct {
	URL       string
	ExpiresAt time.Time
}

type ObjectInfo struct {
	Key         string
	Size        int64
	ContentType string
	ETag        string
}

type Provider interface {
	PresignPut(ctx context.Context, key string, contentType string, size int64) (PresignResult, error)
	PresignGet(ctx context.Context, key string) (PresignResult, error)
	HeadObject(ctx context.Context, key string) (ObjectInfo, error)
	DeleteObject(ctx context.Context, key string) error
}
