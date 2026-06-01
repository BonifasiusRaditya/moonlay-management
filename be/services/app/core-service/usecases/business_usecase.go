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
	importURL       string
	aiConfidenceURL string
	httpClient      *http.Client
	db              *gorm.DB
}

func NewBusinessImport(db *gorm.DB) *BusinessUsecase {
	importURL := strings.TrimSpace(os.Getenv("N8N_IMPORT_DOCUMENT_URL"))
	aiConfidenceURL := strings.TrimSpace(os.Getenv("N8N_AI_CONFIDENCE_URL"))

	// nanti dihapus
	if importURL == "" {
		importURL = "http://localhost:5678/webhook/import_document"
	}
	if aiConfidenceURL == "" {
		aiConfidenceURL = "http://localhost:5678/webhook/ai_confidence"
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
		importURL:       importURL,
		aiConfidenceURL: aiConfidenceURL,
		db:              db,
		httpClient:      httpClient,
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

func (u *BusinessUsecase) ImportDocument(ctx context.Context, filename string, content []byte, uploaderID uint) (int, string, int, int, error) {
	status, body, err := u.postMultipartFile(ctx, u.importURL, filename, content, nil, "business.import-document.usecase")
	if err != nil {
		return status, body, 0, 0, err
	}

	documents, err := decodeImportedDocuments([]byte(body))
	if err != nil || len(documents) == 0 {
		if err == nil {
			err = fmt.Errorf("document payload is empty")
		}
		log.Printf("business.import-document.usecase: decode documents failed file=%s err=%v body=%s", filename, err, body)
		return status, body, 0, 0, err
	}
	log.Printf("business.import-document.usecase: decode documents success count=%d", len(documents))

	documentSavedCount, savedDocumentID, saveErr := u.SaveImportedDocuments(ctx, documents, uploaderID)
	if saveErr != nil {
		log.Printf("business.import-document.usecase: save documents failed file=%s err=%v", filename, saveErr)
		return status, body, 0, 0, saveErr
	}
	log.Printf("business.import-document.usecase: documents saved file=%s saved_count=%d first_document_id=%s", filename, documentSavedCount, savedDocumentID)
	log.Printf("business.import-document.usecase: documents persisted, triggering ai_confidence file=%s document_saved_count=%d url=%s", filename, documentSavedCount, u.aiConfidenceURL)

	aiStatus, aiBody, err := u.postMultipartFile(ctx, u.aiConfidenceURL, filename, content, map[string]string{"document_id": savedDocumentID}, "business.ai-confidence.usecase")
	if err != nil {
		return aiStatus, aiBody, documentSavedCount, 0, err
	}

	entries, err := decodeAIConfidenceEntries([]byte(aiBody), savedDocumentID)
	if err != nil {
		log.Printf("business.ai-confidence.usecase: decode response failed file=%s err=%v body=%s", filename, err, aiBody)
		return aiStatus, aiBody, documentSavedCount, 0, err
	}
	log.Printf("business.ai-confidence.usecase: decoded entries file=%s count=%d", filename, len(entries))

	aiSavedItems, err := u.AddJournalEntries(ctx, entries)
	if err != nil {
		log.Printf("business.ai-confidence.usecase: db insert failed file=%s err=%v", filename, err)
		return aiStatus, aiBody, documentSavedCount, 0, err
	}
	log.Printf("business.ai-confidence.usecase: db insert success file=%s saved_count=%d", filename, len(aiSavedItems))

	return aiStatus, aiBody, documentSavedCount, len(aiSavedItems), nil
}

func (u *BusinessUsecase) postMultipartFile(ctx context.Context, targetURL, filename string, content []byte, fields map[string]string, logPrefix string) (int, string, error) {
	if strings.TrimSpace(targetURL) == "" {
		return 0, "", fmt.Errorf("upstream url is required")
	}

	log.Printf("%s: preparing upstream request file=%s bytes=%d url=%s", logPrefix, filename, len(content), targetURL)
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

	if len(fields) > 0 {
		payload.Reset()
		writer = multipart.NewWriter(&payload)

		for key, value := range fields {
			if err := writer.WriteField(key, value); err != nil {
				return 0, "", err
			}
		}

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
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, targetURL, &payload)
	if err != nil {
		log.Printf("%s: new request failed file=%s err=%v", logPrefix, filename, err)
		return 0, "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := u.httpClient.Do(req)
	if err != nil {
		log.Printf("%s: upstream call failed file=%s err=%v", logPrefix, filename, err)
		return 0, "", err
	}
	defer resp.Body.Close()
	log.Printf("%s: upstream response file=%s status=%s", logPrefix, filename, resp.Status)

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		log.Printf("%s: read upstream body failed file=%s status=%s err=%v", logPrefix, filename, resp.Status, err)
		return resp.StatusCode, "", err
	}
	log.Printf("%s: upstream body file=%s bytes=%d body=%s", logPrefix, filename, len(body), string(body))

	if resp.StatusCode >= http.StatusBadRequest {
		log.Printf("%s: upstream returned error file=%s status=%d", logPrefix, filename, resp.StatusCode)
		return resp.StatusCode, string(body), fmt.Errorf("n8n upload failed: %s", resp.Status)
	}

	return resp.StatusCode, string(body), nil
}

type aiConfidenceWebhookResponse struct {
	Response int                     `json:"response"`
	Data     aiConfidenceWebhookData `json:"data"`
}

type aiConfidenceWebhookData struct {
	TransactionsBusiness aiConfidenceTransactionBusiness `json:"transactions_business"`
	BusinessAIConfidence aiConfidenceBusinessConfidence  `json:"business_ai_confidence"`
}

type aiConfidenceTransactionBusiness struct {
	DocumentID      string  `json:"document_id"`
	InvoiceNumber   string  `json:"invoice_number"`
	TransactionDate string  `json:"transaction_date"`
	Vendor          string  `json:"vendor"`
	Amount          float64 `json:"amount"`
	COA             string  `json:"coa"`
	ScoreAI         float64 `json:"score_ai"`
	Status          string  `json:"status"`
}

type aiConfidenceBusinessConfidence struct {
	ConfidenceScore                   float64  `json:"confidence_score"`
	ConfidenceLevel                   string   `json:"confidence_level"`
	COARecommendation                 string   `json:"coa_recommendation"`
	HistoryMatchScore                 float64  `json:"history_match_score"`
	HistoryMatchWeight                float64  `json:"history_match_weight"`
	HistoryMatchReason                string   `json:"history_match_reason"`
	VendorMatchScore                  float64  `json:"vendor_match_score"`
	VendorMatchWeight                 float64  `json:"vendor_match_weight"`
	VendorMatchReason                 string   `json:"vendor_match_reason"`
	AmountPatternScore                float64  `json:"amount_pattern_score"`
	AmountPatternWeight               float64  `json:"amount_pattern_weight"`
	AmountPatternHistoricalAverage    *float64 `json:"amount_pattern_historical_average"`
	AmountPatternDifferencePercentage float64  `json:"amount_pattern_difference_percentage"`
	AmountPatternReason               string   `json:"amount_pattern_reason"`
	KeywordMatchScore                 float64  `json:"keyword_match_score"`
	KeywordMatchWeight                float64  `json:"keyword_match_weight"`
	KeywordMatchReason                string   `json:"keyword_match_reason"`
	FrequencyPatternScore             float64  `json:"frequency_pattern_score"`
	FrequencyPatternWeight            float64  `json:"frequency_pattern_weight"`
	FrequencyPatternReason            string   `json:"frequency_pattern_reason"`
	SummaryMostSimilarTransaction     string   `json:"summary_most_similar_transaction"`
	SummaryRiskLevel                  string   `json:"summary_risk_level"`
	SummaryRecommendation             string   `json:"summary_recommendation"`
	SummaryInvoiceTypePrediction      string   `json:"summary_invoice_type_prediction"`
}

func decodeAIConfidenceEntries(body []byte, defaultDocumentID string) ([]models.JournalEntryRequest, error) {
	var wrapper aiConfidenceWebhookResponse
	if err := json.Unmarshal(body, &wrapper); err == nil {
		entry, err := aiConfidenceDataToJournalEntry(wrapper.Data, defaultDocumentID)
		if err != nil {
			return nil, err
		}
		return []models.JournalEntryRequest{entry}, nil
	}

	var single aiConfidenceWebhookData
	if err := json.Unmarshal(body, &single); err == nil {
		entry, err := aiConfidenceDataToJournalEntry(single, defaultDocumentID)
		if err != nil {
			return nil, err
		}
		return []models.JournalEntryRequest{entry}, nil
	}

	return nil, fmt.Errorf("payload must contain ai confidence response data")
}

func aiConfidenceDataToJournalEntry(data aiConfidenceWebhookData, defaultDocumentID string) (models.JournalEntryRequest, error) {
	transaction := data.TransactionsBusiness
	confidence := data.BusinessAIConfidence

	if strings.TrimSpace(transaction.InvoiceNumber) == "" {
		return models.JournalEntryRequest{}, fmt.Errorf("invoice_number is required in ai confidence response")
	}
	if strings.TrimSpace(transaction.Vendor) == "" {
		return models.JournalEntryRequest{}, fmt.Errorf("vendor is required in ai confidence response")
	}

	documentID := strings.TrimSpace(transaction.DocumentID)
	if !isUUID(documentID) {
		documentID = strings.TrimSpace(defaultDocumentID)
	}

	return models.JournalEntryRequest{
		DocumentID:        documentID,
		InvoiceNumber:     strings.TrimSpace(transaction.InvoiceNumber),
		TransactionDate:   strings.TrimSpace(transaction.TransactionDate),
		Vendor:            strings.TrimSpace(transaction.Vendor),
		Amount:            transaction.Amount,
		COA:               strings.TrimSpace(transaction.COA),
		Status:            strings.TrimSpace(transaction.Status),
		ConfidenceScore:   confidence.ConfidenceScore,
		COARecommendation: strings.TrimSpace(confidence.COARecommendation),
		ConfidenceLevel:   strings.TrimSpace(confidence.ConfidenceLevel),
		Analysis: models.JournalAnalysisBundle{
			HistoryMatch: models.JournalAnalysisSection{
				Score:  confidence.HistoryMatchScore,
				Weight: confidence.HistoryMatchWeight,
				Reason: strings.TrimSpace(confidence.HistoryMatchReason),
			},
			VendorMatch: models.JournalAnalysisSection{
				Score:  confidence.VendorMatchScore,
				Weight: confidence.VendorMatchWeight,
				Reason: strings.TrimSpace(confidence.VendorMatchReason),
			},
			AmountPattern: models.JournalAnalysisSection{
				Score:                confidence.AmountPatternScore,
				Weight:               confidence.AmountPatternWeight,
				HistoricalAverage:    derefFloat64(confidence.AmountPatternHistoricalAverage),
				DifferencePercentage: confidence.AmountPatternDifferencePercentage,
				Reason:               strings.TrimSpace(confidence.AmountPatternReason),
			},
			KeywordMatch: models.JournalAnalysisSection{
				Score:  confidence.KeywordMatchScore,
				Weight: confidence.KeywordMatchWeight,
				Reason: strings.TrimSpace(confidence.KeywordMatchReason),
			},
			FrequencyPattern: models.JournalAnalysisSection{
				Score:  confidence.FrequencyPatternScore,
				Weight: confidence.FrequencyPatternWeight,
				Reason: strings.TrimSpace(confidence.FrequencyPatternReason),
			},
		},
		Summary: models.JournalSummarySection{
			MostSimilarTransaction: strings.TrimSpace(confidence.SummaryMostSimilarTransaction),
			RiskLevel:              strings.TrimSpace(confidence.SummaryRiskLevel),
			Recommendation:         strings.TrimSpace(confidence.SummaryRecommendation),
			InvoiceTypePrediction:  strings.TrimSpace(confidence.SummaryInvoiceTypePrediction),
		},
	}, nil
}

func derefFloat64(value *float64) float64 {
	if value == nil {
		return 0
	}
	return *value
}

func isUUID(value string) bool {
	if len(value) != 36 {
		return false
	}

	value = strings.ToLower(value)
	for index, char := range value {
		switch index {
		case 8, 13, 18, 23:
			if char != '-' {
				return false
			}
		default:
			if !(char >= '0' && char <= '9' || char >= 'a' && char <= 'f') {
				return false
			}
		}
	}

	return true
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

func (u *BusinessUsecase) SaveImportedDocuments(ctx context.Context, docs []models.ImportedDocument, uploaderID uint) (int, string, error) {
	if u.db == nil {
		return 0, "", fmt.Errorf("database connection is not initialized")
	}

	log.Printf("business.import-document.usecase.SaveImportedDocuments: start docs_count=%d uploaderID=%d", len(docs), uploaderID)

	now := time.Now().UTC()
	firstDocumentID := ""
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
			if firstDocumentID == "" {
				firstDocumentID = document.ID
			}
			log.Printf("business.import-document.usecase: document inserted id=%s source_id=%s file=%s", document.ID, strings.TrimSpace(doc.ID), strings.TrimSpace(doc.FileName))
		}
		return nil
	})
	if err != nil {
		log.Printf("business.import-document.usecase.SaveImportedDocuments: transaction failed err=%v", err)
		return 0, "", err
	}

	log.Printf("business.import-document.usecase.SaveImportedDocuments: success saved_count=%d first_document_id=%s", len(docs), firstDocumentID)
	return len(docs), firstDocumentID, nil
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
				CreatedAt:       now,
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
				CreatedAt:                         now,
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

func nullableStringPtr(value string) *string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
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
