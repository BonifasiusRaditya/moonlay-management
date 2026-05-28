package usecases

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"digisign-portal/services/app/core-service/models"

	"gorm.io/gorm"
)

type BusinessUsecase struct {
	upstreamURL string
	httpClient  *http.Client
	db          *gorm.DB
}

func NewBusinessImport(db *gorm.DB) *BusinessUsecase {
	upstreamURL := strings.TrimSpace(os.Getenv("N8N_IMPORT_DOCUMENT_URL"))

	// nanti dihapus
	if upstreamURL == "" {
		upstreamURL = "http://localhost:5678/webhook-test/import_document"
	}

	timeoutSeconds := 0
	if rawTimeout := strings.TrimSpace(os.Getenv("N8N_IMPORT_DOCUMENT_TIMEOUT_SECONDS")); rawTimeout != "" {
		if parsedTimeout, err := strconv.Atoi(rawTimeout); err == nil && parsedTimeout >= 0 {
			timeoutSeconds = parsedTimeout
		}
	}

	httpClient := &http.Client{}
	if timeoutSeconds > 0 {
		httpClient.Timeout = time.Duration(timeoutSeconds) * time.Second
	}

	return &BusinessUsecase{
		upstreamURL: upstreamURL,
		db:          db,
		httpClient:  httpClient,
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

func (u *BusinessUsecase) ImportDocument(ctx context.Context, filename string, content []byte, uploaderID uint) (int, string, int, error) {
	log.Printf("business.import-document.usecase: preparing upstream request file=%s bytes=%d url=%s", filename, len(content), u.upstreamURL)
	var payload bytes.Buffer
	writer := multipart.NewWriter(&payload)

	// Create form file header with explicit Content-Type based on file type
	header := make(textproto.MIMEHeader)
	header.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename="%s"`, filepath.Base(filename)))
	header.Set("Content-Type", getMIMEType(filename))

	part, err := writer.CreatePart(header)
	if err != nil {
		return 0, "", 0, err
	}
	if _, err := part.Write(content); err != nil {
		return 0, "", 0, err
	}
	if err := writer.Close(); err != nil {
		return 0, "", 0, err
	}

	req, err := http.NewRequest(http.MethodPost, u.upstreamURL, &payload)
	if err != nil {
		log.Printf("business.import-document.usecase: new request failed file=%s err=%v", filename, err)
		return 0, "", 0, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := u.httpClient.Do(req)
	if err != nil {
		log.Printf("business.import-document.usecase: upstream call failed file=%s err=%v", filename, err)
		return 0, "", 0, err
	}
	defer resp.Body.Close()
	log.Printf("business.import-document.usecase: upstream response file=%s status=%s", filename, resp.Status)

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		log.Printf("business.import-document.usecase: read upstream body failed file=%s status=%s err=%v", filename, resp.Status, err)
		return resp.StatusCode, "", 0, err
	}
	log.Printf("business.import-document.usecase: upstream body file=%s bytes=%d body=%s", filename, len(body), string(body))

	if resp.StatusCode >= http.StatusBadRequest {
		log.Printf("business.import-document.usecase: upstream returned error file=%s status=%d", filename, resp.StatusCode)
		return resp.StatusCode, string(body), 0, fmt.Errorf("n8n upload failed: %s", resp.Status)
	}

	documents, err := decodeImportedDocuments(body)
	if err == nil && len(documents) > 0 {
		log.Printf("business.import-document.usecase: decode documents SUCCESS count=%d", len(documents))
		savedCount, saveErr := u.SaveImportedDocuments(ctx, documents, uploaderID)
		if saveErr != nil {
			log.Printf("business.import-document.usecase: save documents failed file=%s err=%v", filename, saveErr)
			return resp.StatusCode, string(body), 0, saveErr
		}
		log.Printf("business.import-document.usecase: documents saved file=%s saved_count=%d", filename, savedCount)
		return resp.StatusCode, string(body), savedCount, nil
	}
	if err != nil {
		log.Printf("business.import-document.usecase: decode documents FAILED file=%s err=%v (trying journal entries fallback)", filename, err)
	}

	entries, err := decodeJournalEntries(body)
	if err != nil {
		log.Printf("business.import-document.usecase: decode response failed file=%s err=%v body=%s", filename, err, string(body))
		return resp.StatusCode, string(body), 0, err
	}
	log.Printf("business.import-document.usecase: decoded entries file=%s count=%d", filename, len(entries))

	inserted, err := u.AddJournalEntries(ctx, entries)
	if err != nil {
		log.Printf("business.import-document.usecase: db insert failed file=%s err=%v", filename, err)
		return resp.StatusCode, string(body), 0, err
	}
	log.Printf("business.import-document.usecase: db insert success file=%s saved_count=%d", filename, len(inserted))

	return resp.StatusCode, string(body), len(inserted), nil
}

func decodeImportedDocuments(body []byte) ([]models.ImportedDocument, error) {
	var docs []models.ImportedDocument
	if err := json.Unmarshal(body, &docs); err == nil {
		if len(docs) == 0 {
			return nil, fmt.Errorf("document payload is empty")
		}
		return docs, nil
	}

	var single models.ImportedDocument
	if err := json.Unmarshal(body, &single); err == nil {
		if strings.TrimSpace(single.ID) == "" {
			return nil, fmt.Errorf("document payload is missing id")
		}
		return []models.ImportedDocument{single}, nil
	}

	var wrapper struct {
		Data any `json:"data"`
	}
	if err := json.Unmarshal(body, &wrapper); err == nil && wrapper.Data != nil {
		wrapped, err := json.Marshal(wrapper.Data)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal wrapped document response: %w", err)
		}

		if err := json.Unmarshal(wrapped, &docs); err == nil && len(docs) > 0 {
			return docs, nil
		}
		if err := json.Unmarshal(wrapped, &single); err == nil && strings.TrimSpace(single.ID) != "" {
			return []models.ImportedDocument{single}, nil
		}
	}

	return nil, fmt.Errorf("payload must be a documents array/object or wrapped data object")
}

func (u *BusinessUsecase) SaveImportedDocuments(ctx context.Context, docs []models.ImportedDocument, uploaderID uint) (int, error) {
	if u.db == nil {
		return 0, fmt.Errorf("database connection is not initialized")
	}

	log.Printf("business.import-document.usecase.SaveImportedDocuments: start docs_count=%d uploaderID=%d", len(docs), uploaderID)

	now := time.Now().UTC()
	err := u.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, doc := range docs {
			fileURL := strings.TrimSpace(doc.WebContentLink)
			if fileURL == "" {
				fileURL = strings.TrimSpace(doc.WebViewLink)
			}
			if fileURL == "" {
				log.Printf("business.import-document.usecase: no file url found for document id=%s file=%s", doc.ID, doc.FileName)
				return fmt.Errorf("document file url is required")
			}

			fileExtension := strings.ToLower(filepath.Ext(doc.FileName))
			if fileExtension == "" {
				fileExtension = strings.TrimSpace(doc.FileExtension)
			}

			document := models.Document{
				FileName:      strings.TrimSpace(doc.FileName),
				FileExtension: fileExtension,
				FileType:      strings.TrimSpace(doc.FileType),
				FileURL:       fileURL,
				UploadedBy:    uploaderID,
				UploadedAt:    now,
			}
			log.Printf("business.import-document.usecase: before create document file_name=%s uploaded_by=%d", document.FileName, document.UploadedBy)

			if err := tx.Create(&document).Error; err != nil {
				log.Printf("business.import-document.usecase: tx.Create failed err=%v", err)
				return err
			}
			log.Printf("business.import-document.usecase: document inserted id=%s source_id=%s file=%s", document.ID, strings.TrimSpace(doc.ID), strings.TrimSpace(doc.FileName))
		}
		return nil
	})
	if err != nil {
		log.Printf("business.import-document.usecase.SaveImportedDocuments: transaction failed err=%v", err)
		return 0, err
	}

	log.Printf("business.import-document.usecase.SaveImportedDocuments: success saved_count=%d", len(docs))
	return len(docs), nil
}

func decodeJournalEntries(body []byte) ([]models.JournalEntryRequest, error) {
	var entries []models.JournalEntryRequest
	if err := json.Unmarshal(body, &entries); err == nil {
		return entries, nil
	}

	var single models.JournalEntryRequest
	if err := json.Unmarshal(body, &single); err == nil {
		return []models.JournalEntryRequest{single}, nil
	}

	var wrapper struct {
		Data any `json:"data"`
	}
	if err := json.Unmarshal(body, &wrapper); err == nil && wrapper.Data != nil {
		wrapped, err := json.Marshal(wrapper.Data)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal wrapped response: %w", err)
		}

		if err := json.Unmarshal(wrapped, &entries); err == nil {
			return entries, nil
		}
		if err := json.Unmarshal(wrapped, &single); err == nil {
			return []models.JournalEntryRequest{single}, nil
		}
	}

	return nil, fmt.Errorf("payload must be a JSON array, object, or wrapped data object")
}

func (u *BusinessUsecase) AddJournalEntries(ctx context.Context, entries []models.JournalEntryRequest) ([]models.BusinessTransactionListItem, error) {
	if u.db == nil {
		return nil, fmt.Errorf("database connection is not initialized")
	}
	log.Printf("business.add-journal-entries: start count=%d", len(entries))

	now := time.Now().UTC()
	results := make([]models.BusinessTransactionListItem, 0, len(entries))

	err := u.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, entry := range entries {
			invoiceNumber := strings.TrimSpace(entry.InvoiceNumber)
			vendor := strings.TrimSpace(entry.Vendor)
			if invoiceNumber == "" {
				return fmt.Errorf("invoice_number is required")
			}
			if vendor == "" {
				return fmt.Errorf("vendor is required")
			}
			if entry.Amount == 0 {
				return fmt.Errorf("amount is required")
			}

			transactionDate, err := parseJournalDate(entry.TransactionDate, now)
			if err != nil {
				return err
			}

			coaValue := deriveJournalCOA(entry)
			statusValue := deriveJournalStatus(entry)
			documentID := nullableStringPtr(entry.DocumentID)

			transaction := models.BusinessTransaction{
				DocumentID:      documentID,
				InvoiceNumber:   invoiceNumber,
				TransactionDate: transactionDate,
				Vendor:          vendor,
				Amount:          entry.Amount,
				COA:             coaValue,
				ScoreAI:         entry.ConfidenceScore,
				Status:          statusValue,
			}

			if err := tx.Create(&transaction).Error; err != nil {
				log.Printf("business.add-journal-entries: insert transaction failed invoice=%s vendor=%s err=%v", entry.InvoiceNumber, entry.Vendor, err)
				return err
			}
			transactionID := transaction.ID
			log.Printf("business.add-journal-entries: transaction inserted id=%s invoice=%s vendor=%s amount=%.2f", transactionID, entry.InvoiceNumber, entry.Vendor, entry.Amount)

			confidence := models.BusinessAIConfidence{
				TransactionID:                     transactionID,
				ConfidenceScore:                   entry.ConfidenceScore,
				ConfidenceLevel:                   strings.TrimSpace(entry.ConfidenceLevel),
				COARecommendation:                 strings.TrimSpace(entry.COARecommendation),
				HistoryMatchScore:                 entry.Analysis.HistoryMatch.Score,
				HistoryMatchWeight:                entry.Analysis.HistoryMatch.Weight,
				HistoryMatchReason:                entry.Analysis.HistoryMatch.Reason,
				VendorMatchScore:                  entry.Analysis.VendorMatch.Score,
				VendorMatchWeight:                 entry.Analysis.VendorMatch.Weight,
				VendorMatchReason:                 entry.Analysis.VendorMatch.Reason,
				AmountPatternScore:                entry.Analysis.AmountPattern.Score,
				AmountPatternWeight:               entry.Analysis.AmountPattern.Weight,
				AmountPatternHistoricalAverage:    nullIfZeroFloat64(entry.Analysis.AmountPattern.HistoricalAverage),
				AmountPatternDifferencePercentage: entry.Analysis.AmountPattern.DifferencePercentage,
				AmountPatternReason:               entry.Analysis.AmountPattern.Reason,
				KeywordMatchScore:                 entry.Analysis.KeywordMatch.Score,
				KeywordMatchWeight:                entry.Analysis.KeywordMatch.Weight,
				KeywordMatchReason:                entry.Analysis.KeywordMatch.Reason,
				FrequencyPatternScore:             entry.Analysis.FrequencyPattern.Score,
				FrequencyPatternWeight:            entry.Analysis.FrequencyPattern.Weight,
				FrequencyPatternReason:            entry.Analysis.FrequencyPattern.Reason,
				SummaryMostSimilarTransaction:     strings.TrimSpace(entry.Summary.MostSimilarTransaction),
				SummaryRiskLevel:                  strings.TrimSpace(entry.Summary.RiskLevel),
				SummaryRecommendation:             strings.TrimSpace(entry.Summary.Recommendation),
				SummaryInvoiceTypePrediction:      strings.TrimSpace(entry.Summary.InvoiceTypePrediction),
			}

			if err := tx.Create(&confidence).Error; err != nil {
				log.Printf("business.add-journal-entries: insert confidence failed transaction_id=%s err=%v", transactionID, err)
				return err
			}
			log.Printf("Business.add-journal-entries: confidence inserted transaction_id=%s confidence_score=%.2f", transactionID, entry.ConfidenceScore)

			results = append(results, models.BusinessTransactionListItem{
				ID:       transactionID,
				Date:     transactionDate.Format("02 Jan 2006"),
				Time:     now.Format("15:04"),
				Vendor:   vendor,
				Initials: initialsFromVendor(entry.Vendor),
				Amount:   formatMoneyIDR(entry.Amount),
				COA:      coaValue,
				Score:    roundScore(entry.ConfidenceScore),
				Status:   statusValue,
			})
		}
		return nil
	})
	if err != nil {
		log.Printf("Business.add-journal-entries: transaction rolled back err=%v", err)
	} else {
		log.Printf("Business.add-journal-entries: transaction committed saved_count=%d", len(results))
	}

	return results, err
}

func (u *BusinessUsecase) ListBusinessTransactions(ctx context.Context) ([]models.BusinessTransactionListItem, error) {
	if u.db == nil {
		return nil, fmt.Errorf("database connection is not initialized")
	}

	type row struct {
		ID            string    `gorm:"column:id"`
		TransactionAt time.Time `gorm:"column:transaction_date"`
		CreatedAt     time.Time `gorm:"column:created_at"`
		Vendor        string    `gorm:"column:vendor"`
		Amount        float64   `gorm:"column:amount"`
		COA           string    `gorm:"column:coa"`
		Score         float64   `gorm:"column:score"`
		Status        string    `gorm:"column:status"`
	}

	var rows []row
	if err := u.db.WithContext(ctx).
		Table("transactions_business tb").
		Select(`tb.id,
			tb.transaction_date,
			tb.created_at,
			tb.vendor,
			tb.amount,
			tb.coa,
			COALESCE(bc.confidence_score, tb.score_ai, 0) AS score,
			tb.status`).
		Joins("LEFT JOIN business_ai_confidence bc ON bc.transaction_id = tb.id").
		Order("tb.created_at DESC").
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	items := make([]models.BusinessTransactionListItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, models.BusinessTransactionListItem{
			ID:       row.ID,
			Date:     row.TransactionAt.Format("02 Jan 2006"),
			Time:     row.CreatedAt.Format("15:04"),
			Vendor:   row.Vendor,
			Initials: initialsFromVendor(row.Vendor),
			Amount:   formatMoneyIDR(row.Amount),
			COA:      row.COA,
			Score:    roundScore(row.Score),
			Status:   row.Status,
		})
	}

	return items, nil
}

func parseJournalDate(input string, fallback time.Time) (time.Time, error) {
	trimmed := strings.TrimSpace(input)
	if trimmed == "" {
		return fallback.UTC(), nil
	}

	layouts := []string{time.RFC3339, time.RFC3339Nano, "2006-01-02", "02-01-2006", "02/01/2006"}
	for _, layout := range layouts {
		if parsed, err := time.Parse(layout, trimmed); err == nil {
			return parsed.UTC(), nil
		}
	}

	return time.Time{}, fmt.Errorf("invalid transaction_date: %s", input)
}

func deriveJournalCOA(entry models.JournalEntryRequest) string {
	if trimmed := strings.TrimSpace(entry.COA); trimmed != "" {
		return trimmed
	}

	trimmedRecommendation := strings.TrimSpace(entry.COARecommendation)
	if trimmedRecommendation == "" {
		return ""
	}

	parts := strings.Split(trimmedRecommendation, ",")
	if len(parts) >= 2 {
		return strings.TrimSpace(parts[0]) + ", " + strings.TrimSpace(parts[1])
	}

	return trimmedRecommendation
}

func deriveJournalStatus(entry models.JournalEntryRequest) string {
	if trimmed := strings.TrimSpace(entry.Status); trimmed != "" {
		return trimmed
	}

	confidence := strings.ToLower(strings.TrimSpace(entry.ConfidenceLevel))
	risk := strings.ToLower(strings.TrimSpace(entry.Summary.RiskLevel))
	if strings.Contains(confidence, "high") || strings.Contains(risk, "low") {
		return "verified"
	}
	return "review"
}

func nullableString(value string) any {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	return trimmed
}

func nullableStringPtr(value string) *string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func nullIfZero(value float64) any {
	if value == 0 || math.IsNaN(value) || math.IsInf(value, 0) {
		return nil
	}
	return value
}

func nullIfZeroFloat64(value float64) *float64 {
	if value == 0 || math.IsNaN(value) || math.IsInf(value, 0) {
		return nil
	}
	result := value
	return &result
}

func initialsFromVendor(vendor string) string {
	trimmed := strings.TrimSpace(vendor)
	if trimmed == "" {
		return ""
	}

	parts := strings.Fields(trimmed)
	if len(parts) == 0 {
		return ""
	}

	if len(parts) == 1 {
		runes := []rune(parts[0])
		if len(runes) >= 2 {
			return strings.ToUpper(string(runes[:2]))
		}
		return strings.ToUpper(parts[0])
	}

	first := []rune(parts[0])
	second := []rune(parts[1])
	return strings.ToUpper(string(first[:1]) + string(second[:1]))
}

func formatMoneyIDR(amount float64) string {
	value := fmt.Sprintf("%.0f", amount)
	if value == "" {
		return "0"
	}

	negative := strings.HasPrefix(value, "-")
	if negative {
		value = strings.TrimPrefix(value, "-")
	}

	if value == "" {
		return "0"
	}

	var parts []string
	for len(value) > 3 {
		parts = append([]string{value[len(value)-3:]}, parts...)
		value = value[:len(value)-3]
	}
	if value != "" {
		parts = append([]string{value}, parts...)
	}
	formatted := strings.Join(parts, ".")
	if negative {
		return "-" + formatted
	}
	return formatted
}

func roundScore(value float64) float64 {
	return math.Round(value*100) / 100
}
