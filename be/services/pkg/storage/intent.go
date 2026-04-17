package storage

import (
	"context"
	"fmt"
	"time"
)

type UploadIntent struct {
	Key       string
	UploadURL string
	ExpiresAt time.Time
}

func CreateUploadIntent(ctx context.Context, provider Provider, key string, contentType string, size int64) (*UploadIntent, error) {
	result, err := provider.PresignPut(ctx, key, contentType, size)
	if err != nil {
		return nil, err
	}

	return &UploadIntent{
		Key:       key,
		UploadURL: result.URL,
		ExpiresAt: result.ExpiresAt,
	}, nil
}

func FinalizeUpload(ctx context.Context, provider Provider, key string, expectedSize int64, expectedContentType string) (*ObjectInfo, error) {
	info, err := provider.HeadObject(ctx, key)
	if err != nil {
		return nil, err
	}

	if expectedSize > 0 && info.Size != expectedSize {
		return nil, fmt.Errorf("unexpected object size for %s", key)
	}
	if expectedContentType != "" && info.ContentType != "" && info.ContentType != expectedContentType {
		return nil, fmt.Errorf("unexpected content type for %s", key)
	}

	return &info, nil
}
