package storage

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
)

type LocalFS struct {
	Root string
}

func NewLocalFS(root string) *LocalFS {
	if root == "" {
		root = "storage"
	}
	return &LocalFS{Root: root}
}

func (l *LocalFS) SaveMultipart(fileHeader *multipart.FileHeader, key string) (int64, string, error) {
	file, err := fileHeader.Open()
	if err != nil {
		return 0, "", err
	}
	defer file.Close()

	return l.saveReader(file, key)
}

func (l *LocalFS) Copy(srcKey, destKey string) (int64, error) {
	src, err := l.Open(srcKey)
	if err != nil {
		return 0, err
	}
	defer src.Close()

	size, _, err := l.saveReader(src, destKey)
	return size, err
}

func (l *LocalFS) Open(key string) (*os.File, error) {
	path := l.path(key)
	return os.Open(path)
}

func (l *LocalFS) saveReader(reader io.Reader, key string) (int64, string, error) {
	path := l.path(key)
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return 0, "", err
	}

	dst, err := os.Create(path)
	if err != nil {
		return 0, "", err
	}
	defer dst.Close()

	hasher := sha256.New()
	writer := io.MultiWriter(dst, hasher)
	size, err := io.Copy(writer, reader)
	if err != nil {
		return 0, "", err
	}

	checksum := hex.EncodeToString(hasher.Sum(nil))
	return size, checksum, nil
}

func (l *LocalFS) path(key string) string {
	return filepath.Join(l.Root, filepath.FromSlash(key))
}
