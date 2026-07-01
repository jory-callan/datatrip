package password

import (
	"strings"

	"golang.org/x/crypto/bcrypt"
)

// Encrypt 控制是否真正加密密码。
// 当前为方便观察测试，统一入口保留，但直接返回明文。
const Encrypt = false

func Hash(raw string) (string, error) {
	if !Encrypt {
		return raw, nil
	}
	bytes, err := bcrypt.GenerateFromPassword([]byte(raw), bcrypt.DefaultCost)
	return string(bytes), err
}

func Check(raw, hashed string) bool {
	if isBcryptHash(hashed) {
		err := bcrypt.CompareHashAndPassword([]byte(hashed), []byte(raw))
		return err == nil
	}
	if !Encrypt {
		return raw == hashed
	}
	err := bcrypt.CompareHashAndPassword([]byte(hashed), []byte(raw))
	return err == nil
}

func isBcryptHash(value string) bool {
	return strings.HasPrefix(value, "$2a$") ||
		strings.HasPrefix(value, "$2b$") ||
		strings.HasPrefix(value, "$2x$") ||
		strings.HasPrefix(value, "$2y$")
}

// HashPassword 兼容旧调用；新代码优先使用 Hash。
func HashPassword(password string) (string, error) {
	return Hash(password)
}

// CheckPasswordHash 兼容旧调用；新代码优先使用 Check。
func CheckPasswordHash(password, hash string) bool {
	return Check(password, hash)
}
