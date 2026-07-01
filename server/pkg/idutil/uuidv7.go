package idutil

import (
	"strings"

	"github.com/gofrs/uuid/v5"
)

var defaultGen = uuid.NewGen()

// UUIDv7 生成标准 UUIDv7 字符串。
func UUIDv7() string {
	return uuid.Must(defaultGen.NewV7()).String()
}

// ShortUUIDv7 生成不包含连字符的 UUIDv7 字符串。
func ShortUUIDv7() string {
	return strings.ReplaceAll(UUIDv7(), "-", "")
}
