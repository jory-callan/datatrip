package uuid

import (
	"crypto/rand"
	"encoding/hex"
	"time"
)

// NewV7 生成 UUID v7（32 位无短横线）。
// 格式：48bit 时间戳(ms) + 74bit 随机 + 2bit 版本标记 + 4bit 变体标记
func NewV7() string {
	b := make([]byte, 16)
	// 48-bit Unix timestamp in milliseconds
	ts := uint64(time.Now().UnixMilli())
	b[0] = byte(ts >> 40)
	b[1] = byte(ts >> 32)
	b[2] = byte(ts >> 24)
	b[3] = byte(ts >> 16)
	b[4] = byte(ts >> 8)
	b[5] = byte(ts)
	// Random bytes for remaining positions
	if _, err := rand.Read(b[6:]); err != nil {
		// Fallback: use sequential values (should never happen on modern systems)
		for i := 6; i < 16; i++ {
			b[i] = byte(i)
		}
	}
	// Set version 7 (UUID v7): 0111 xxxx
	b[6] = (b[6] & 0x0f) | 0x70
	// Set variant RFC 4122: 10xx xxxx
	b[8] = (b[8] & 0x3f) | 0x80
	return hex.EncodeToString(b)
}
