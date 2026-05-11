package usecases

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type FinanceUsecase struct {
	upstreamURL string
	httpClient  *http.Client
}

func NewFinanceUsecase() *FinanceUsecase {
	upstreamURL := strings.TrimSpace(os.Getenv("N8N_IMPORT_DOCUMENT_URL"))
	if upstreamURL == "" {
		upstreamURL = "http://localhost:5678/webhook-test/import_document"
	}

	return &FinanceUsecase{
		upstreamURL: upstreamURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// getMIMEType returns the MIME type based on file extension
func getMIMEType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	mimeTypes := map[string]string{
		".pdf":  "application/pdf",
		".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		".xls":  "application/vnd.ms-excel",
		".csv":  "text/csv",
		".txt":  "text/plain",
		".json": "application/json",
		".xml":  "application/xml",
	}
	if mimeType, ok := mimeTypes[ext]; ok {
		return mimeType
	}
	return "application/octet-stream"
}

func (u *FinanceUsecase) ImportDocument(filename string, content []byte) (int, string, error) {
	var payload bytes.Buffer
	writer := multipart.NewWriter(&payload)

	// Create form file header with explicit Content-Type based on file type
	header := make(textproto.MIMEHeader)
	header.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename="%s"`, filepath.Base(filename)))
	header.Set("Content-Type", getMIMEType(filename))

	part, err := writer.CreatePart(header)
	if err != nil {
		return 0, "", err
	}
	if _, err := part.Write(content); err != nil {
		return 0, "", err
	}
	if err := writer.Close(); err != nil {
		return 0, "", err
	}

	req, err := http.NewRequest(http.MethodPost, u.upstreamURL, &payload)
	if err != nil {
		return 0, "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := u.httpClient.Do(req)
	if err != nil {
		return 0, "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return resp.StatusCode, "", err
	}

	if resp.StatusCode >= http.StatusBadRequest {
		return resp.StatusCode, string(body), fmt.Errorf("n8n upload failed: %s", resp.Status)
	}

	return resp.StatusCode, string(body), nil
}
