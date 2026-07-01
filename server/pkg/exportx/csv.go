package exportx

import (
	"bytes"
	"encoding/csv"
	"strconv"
	"time"
)

type Column[T any] struct {
	Header string
	Value  func(T) string
}

type Result struct {
	Filename    string
	ContentType string
	Data        []byte
}

func CSV[T any](filename string, columns []Column[T], rows []T) (*Result, error) {
	buf := bytes.NewBuffer(nil)
	buf.WriteString("\xEF\xBB\xBF")

	writer := csv.NewWriter(buf)
	headers := make([]string, 0, len(columns))
	for _, col := range columns {
		headers = append(headers, col.Header)
	}
	if err := writer.Write(headers); err != nil {
		return nil, err
	}

	for _, row := range rows {
		record := make([]string, 0, len(columns))
		for _, col := range columns {
			record = append(record, col.Value(row))
		}
		if err := writer.Write(record); err != nil {
			return nil, err
		}
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, err
	}

	return &Result{
		Filename:    filename,
		ContentType: "text/csv; charset=utf-8",
		Data:        buf.Bytes(),
	}, nil
}

func Uint(v uint) string {
	return strconv.FormatUint(uint64(v), 10)
}

func Time(v time.Time) string {
	if v.IsZero() {
		return ""
	}
	return v.Format("2006-01-02 15:04:05")
}
