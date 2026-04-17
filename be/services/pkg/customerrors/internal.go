package customerror

import (
	"fmt"

	"github.com/pkg/errors"
)

type internalError struct {
	TrackableError
}

type InternalError interface {
	error
	IsInternalError() bool
}

func (e *internalError) IsInternalError() bool { return true }

func NewInternalErrorf(format string, data ...interface{}) (err error) {
	err = errors.New(fmt.Sprintf(format, data...))
	return &internalError{TrackableError{err}}
}

func NewInternalError(message string) (err error) {
	err = errors.New(message)
	return &internalError{TrackableError{err}}
}
