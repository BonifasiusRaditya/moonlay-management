package models

import "time"

type JournalAnalysisSection struct {
	Score                float64  `json:"score"`
	Weight               float64  `json:"weight"`
	Reason               string   `json:"reason"`
	MatchedPatterns      []string `json:"matched_patterns,omitempty"`
	MatchedVendor        string   `json:"matched_vendor,omitempty"`
	MatchedKeywords      []string `json:"matched_keywords,omitempty"`
	HistoricalAverage    float64  `json:"historical_average,omitempty"`
	DifferencePercentage float64  `json:"difference_percentage,omitempty"`
	FrequencyFound       int      `json:"frequency_found,omitempty"`
}

type JournalSummarySection struct {
	MostSimilarTransaction string `json:"most_similar_transaction"`
	RiskLevel              string `json:"risk_level"`
	Recommendation         string `json:"recommendation"`
	InvoiceTypePrediction  string `json:"invoice_type_prediction"`
}

type JournalEntryRequest struct {
	TransactionID     string                `json:"transaction_id,omitempty"`
	DocumentID        string                `json:"document_id,omitempty"`
	InvoiceNumber     string                `json:"invoice_number,omitempty"`
	TransactionDate   string                `json:"transaction_date,omitempty"`
	Vendor            string                `json:"vendor,omitempty"`
	Amount            float64               `json:"amount,omitempty"`
	COA               string                `json:"coa,omitempty"`
	Status            string                `json:"status,omitempty"`
	Parse             string                `json:"parse,omitempty"`
	ConfidenceScore   float64               `json:"confidence_score"`
	COARecommendation string                `json:"coa_recommendation"`
	ConfidenceLevel   string                `json:"confidence_level"`
	Analysis          JournalAnalysisBundle `json:"analysis"`
	Summary           JournalSummarySection `json:"summary"`
}

type JournalAnalysisBundle struct {
	HistoryMatch     JournalAnalysisSection `json:"history_match"`
	VendorMatch      JournalAnalysisSection `json:"vendor_match"`
	AmountPattern    JournalAnalysisSection `json:"amount_pattern"`
	KeywordMatch     JournalAnalysisSection `json:"keyword_match"`
	FrequencyPattern JournalAnalysisSection `json:"frequency_pattern"`
}

type BusinessTransactionListItem struct {
	ID       string  `json:"id"`
	Date     string  `json:"date"`
	Time     string  `json:"time"`
	Vendor   string  `json:"vendor"`
	Initials string  `json:"initials"`
	Amount   string  `json:"amount"`
	COA      string  `json:"coa"`
	Score    float64 `json:"score"`
	Status   string  `json:"status"`
}

type BusinessTransaction struct {
	ID              string    `gorm:"column:id;type:uuid;default:gen_random_uuid();primaryKey"`
	DocumentID      *string   `gorm:"column:document_id;type:uuid"`
	InvoiceNumber   string    `gorm:"column:invoice_number"`
	TransactionDate time.Time `gorm:"column:transaction_date"`
	Vendor          string    `gorm:"column:vendor"`
	Amount          float64   `gorm:"column:amount"`
	COA             string    `gorm:"column:coa"`
	ScoreAI         float64   `gorm:"column:score_ai"`
	Status          string    `gorm:"column:status"`
	Parse           string    `gorm:"column:parse"`
	CreatedAt       time.Time `gorm:"column:created_at"`
}

func (BusinessTransaction) TableName() string {
	return "transactions_business"
}

type BusinessAIConfidence struct {
	ID                                string    `gorm:"column:id;type:uuid;default:gen_random_uuid();primaryKey"`
	TransactionID                     string    `gorm:"column:transaction_id;type:uuid"`
	ConfidenceScore                   float64   `gorm:"column:confidence_score"`
	ConfidenceLevel                   string    `gorm:"column:confidence_level"`
	COARecommendation                 string    `gorm:"column:coa_recommendation"`
	HistoryMatchScore                 float64   `gorm:"column:history_match_score"`
	HistoryMatchWeight                float64   `gorm:"column:history_match_weight"`
	HistoryMatchReason                string    `gorm:"column:history_match_reason"`
	VendorMatchScore                  float64   `gorm:"column:vendor_match_score"`
	VendorMatchWeight                 float64   `gorm:"column:vendor_match_weight"`
	VendorMatchReason                 string    `gorm:"column:vendor_match_reason"`
	AmountPatternScore                float64   `gorm:"column:amount_pattern_score"`
	AmountPatternWeight               float64   `gorm:"column:amount_pattern_weight"`
	AmountPatternHistoricalAverage    *float64  `gorm:"column:amount_pattern_historical_average"`
	AmountPatternDifferencePercentage float64   `gorm:"column:amount_pattern_difference_percentage"`
	AmountPatternReason               string    `gorm:"column:amount_pattern_reason"`
	KeywordMatchScore                 float64   `gorm:"column:keyword_match_score"`
	KeywordMatchWeight                float64   `gorm:"column:keyword_match_weight"`
	KeywordMatchReason                string    `gorm:"column:keyword_match_reason"`
	FrequencyPatternScore             float64   `gorm:"column:frequency_pattern_score"`
	FrequencyPatternWeight            float64   `gorm:"column:frequency_pattern_weight"`
	FrequencyPatternReason            string    `gorm:"column:frequency_pattern_reason"`
	SummaryMostSimilarTransaction     string    `gorm:"column:summary_most_similar_transaction"`
	SummaryRiskLevel                  string    `gorm:"column:summary_risk_level"`
	SummaryRecommendation             string    `gorm:"column:summary_recommendation"`
	SummaryInvoiceTypePrediction      string    `gorm:"column:summary_invoice_type_prediction"`
	Status                            *bool     `gorm:"column:status"`
	CreatedAt                         time.Time `gorm:"column:created_at"`
}

func (BusinessAIConfidence) TableName() string {
	return "business_ai_confidence"
}

type TransactionBusinessItem struct {
	ID                    string    `gorm:"column:id;type:uuid;default:gen_random_uuid();primaryKey"`
	TransactionBusinessID string    `gorm:"column:transaction_business_id;type:uuid"`
	ItemName              string    `gorm:"column:item_name"`
	ItemDescription       string    `gorm:"column:item_description"`
	Quantity              float64   `gorm:"column:quantity"`
	UnitPrice             float64   `gorm:"column:unit_price"`
	CreatedAt             time.Time `gorm:"column:created_at"`
}

func (TransactionBusinessItem) TableName() string {
	return "transaction_business_items"
}

type ImportedDocument struct {
	ID             string `json:"id"`
	FileName       string `json:"file_name"`
	FileExtension  string `json:"file_extension"`
	FileType       string `json:"file_type"`
	WebViewLink    string `json:"webViewLink"`
	WebContentLink string `json:"webContentLink"`
	Parse          string `json:"parse"`
}

type Document struct {
	ID            string    `gorm:"column:id;type:uuid;default:gen_random_uuid();primaryKey"`
	FileName      string    `gorm:"column:file_name"`
	FileExtension string    `gorm:"column:file_extension"`
	FileType      string    `gorm:"column:file_type"`
	FileURL       string    `gorm:"column:file_url"`
	UploadedBy    uint      `gorm:"column:uploaded_by"`
	UploadedAt    time.Time `gorm:"column:uploaded_at"`
}

func (Document) TableName() string {
	return "documents"
}

type FinanceImportResponse struct {
	Message                string `json:"message"`
	Filename               string `json:"filename"`
	UpstreamStatus         int    `json:"upstream_status"`
	UpstreamBody           string `json:"-"`
	SavedCount             int    `json:"saved_count"`
	AIConfidenceSavedCount int    `json:"ai_confidence_saved_count"`
}
