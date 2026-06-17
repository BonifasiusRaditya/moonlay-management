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
	Reasoning         string                `json:"reasoning"`
}

type JournalAnalysisBundle struct {
	HistoryMatch     JournalAnalysisSection `json:"history_match"`
	VendorMatch      JournalAnalysisSection `json:"vendor_match"`
	AmountPattern    JournalAnalysisSection `json:"amount_pattern"`
	KeywordMatch     JournalAnalysisSection `json:"keyword_match"`
	FrequencyPattern JournalAnalysisSection `json:"frequency_pattern"`
}

type BusinessTransactionListItem struct {
	ID         string   `json:"id"`
	Date       string   `json:"date"`
	Time       string   `json:"time"`
	Vendor     string   `json:"vendor"`
	Initials   string   `json:"initials"`
	Amount     string   `json:"amount"`
	COA        string   `json:"coa"`
	ItemCOAs   []string `json:"item_coas"`
	Score      float64  `json:"score"`
	Status     string   `json:"status"`
	Department string   `json:"department"`
}

type BusinessTransactionItemDetail struct {
	ID              string  `json:"id"`
	ItemName        string  `json:"item_name"`
	ItemDescription string  `json:"item_description"`
	COA             string  `json:"coa"`
	Quantity        float64 `json:"quantity"`
	UnitPrice       float64 `json:"unit_price"`
	Total           float64 `json:"total"`
}

type BusinessAIConfidenceDetail struct {
	ConfidenceScore   float64 `json:"confidence_score"`
	ConfidenceLevel   string  `json:"confidence_level"`
	COARecommendation string  `json:"coa_recommendation"`
	Reasoning         string  `json:"reasoning"`
}

type BusinessTransactionDetail struct {
	ID                   string                          `json:"id"`
	InvoiceNumber        string                          `json:"invoice_number"`
	Date                 string                          `json:"date"`
	Time                 string                          `json:"time"`
	Vendor               string                          `json:"vendor"`
	Amount               float64                         `json:"amount"`
	COA                  string                          `json:"coa"`
	Status               string                          `json:"status"`
	Score                float64                         `json:"score"`
	Items                []BusinessTransactionItemDetail `json:"items"`
	BusinessAIConfidence *BusinessAIConfidenceDetail     `json:"business_ai_confidence,omitempty"`
	ProjectName          string                          `json:"project_name"`
	Department           string                          `json:"department"`
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
	ProjectName     string    `gorm:"column:project_name"`
	Department      string    `gorm:"column:department"`
	CreatedAt       time.Time `gorm:"column:created_at"`
}

func (BusinessTransaction) TableName() string {
	return "transactions_business"
}

type BusinessAIConfidence struct {
	ID                string    `gorm:"column:id;type:uuid;default:gen_random_uuid();primaryKey"`
	TransactionID     string    `gorm:"column:transaction_id;type:uuid"`
	ConfidenceScore   float64   `gorm:"column:confidence_score"`
	ConfidenceLevel   string    `gorm:"column:confidence_level"`
	COARecommendation string    `gorm:"column:coa_recommendation"`
	Reasoning         string    `gorm:"column:reasoning"`
	CreatedAt         time.Time `gorm:"column:created_at"`
}

func (BusinessAIConfidence) TableName() string {
	return "business_ai_confidence"
}

type TransactionBusinessItem struct {
	ID                    string    `gorm:"column:id;type:uuid;default:gen_random_uuid();primaryKey"`
	TransactionBusinessID string    `gorm:"column:transaction_business_id;type:uuid"`
	ItemName              string    `gorm:"column:item_name"`
	ItemDescription       string    `gorm:"column:item_description"`
	COA                   string    `gorm:"column:coa"`
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
