package models

type FinanceImportResponse struct {
	Message        string `json:"message"`
	Filename       string `json:"filename,omitempty"`
	UpstreamStatus int    `json:"upstream_status"`
	UpstreamBody   string `json:"upstream_body,omitempty"`
}
