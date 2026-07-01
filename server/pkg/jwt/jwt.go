package jwt

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	jwtlib "github.com/golang-jwt/jwt/v5"
)

var (
	ErrEmptyToken    = errors.New("empty token")
	ErrInvalidToken  = errors.New("invalid token")
	ErrInvalidUserID = errors.New("invalid user id")
)

// Claims 是项目默认 JWT Claims。
// Subject 同步保存 user_id，方便兼容标准 JWT 字段。
type Claims struct {
	UserID uint `json:"user_id"`
	jwtlib.RegisteredClaims
}

// Manager 负责签发和解析 JWT。
// 业务代码通常直接使用 global.JWT。
type Manager struct {
	cfg    Config
	secret []byte
}

func New(cfg Config) (*Manager, error) {
	if strings.TrimSpace(cfg.Secret) == "" {
		return nil, errors.New("jwt secret is empty")
	}
	if cfg.Expires <= 0 {
		return nil, errors.New("jwt expires must be greater than zero")
	}

	return &Manager{
		cfg:    cfg,
		secret: []byte(cfg.Secret),
	}, nil
}

func MustNew(cfg Config) *Manager {
	m, err := New(cfg)
	if err != nil {
		panic(fmt.Sprintf("init jwt: %v", err))
	}
	return m
}

func (m *Manager) Generate(userID uint) (string, error) {
	if userID == 0 {
		return "", ErrInvalidUserID
	}

	now := time.Now()
	claims := Claims{
		UserID: userID,
		RegisteredClaims: jwtlib.RegisteredClaims{
			Subject:   strconv.FormatUint(uint64(userID), 10),
			Issuer:    m.cfg.Issuer,
			IssuedAt:  jwtlib.NewNumericDate(now),
			NotBefore: jwtlib.NewNumericDate(now),
			ExpiresAt: jwtlib.NewNumericDate(now.Add(m.cfg.Expires)),
		},
	}

	token := jwtlib.NewWithClaims(jwtlib.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

func (m *Manager) Parse(tokenString string) (*Claims, error) {
	tokenString = strings.TrimSpace(tokenString)
	if tokenString == "" {
		return nil, ErrEmptyToken
	}

	claims := &Claims{}
	token, err := jwtlib.ParseWithClaims(tokenString, claims, func(token *jwtlib.Token) (any, error) {
		if _, ok := token.Method.(*jwtlib.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected jwt signing method: %v", token.Header["alg"])
		}
		return m.secret, nil
	}, jwtlib.WithIssuer(m.cfg.Issuer))
	if err != nil {
		return nil, err
	}
	if token == nil || !token.Valid {
		return nil, ErrInvalidToken
	}
	if claims.UserID == 0 && claims.Subject != "" {
		id, err := strconv.ParseUint(claims.Subject, 10, 64)
		if err != nil || id == 0 {
			return nil, ErrInvalidUserID
		}
		claims.UserID = uint(id)
	}
	if claims.UserID == 0 {
		return nil, ErrInvalidUserID
	}

	return claims, nil
}

func (m *Manager) UserID(tokenString string) (uint, error) {
	claims, err := m.Parse(tokenString)
	if err != nil {
		return 0, err
	}
	return claims.UserID, nil
}

// FromBearer 从 Authorization 请求头中取出 Bearer token。
func FromBearer(authorization string) (string, error) {
	authorization = strings.TrimSpace(authorization)
	if authorization == "" {
		return "", ErrEmptyToken
	}

	parts := strings.SplitN(authorization, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || strings.TrimSpace(parts[1]) == "" {
		return "", ErrInvalidToken
	}
	return strings.TrimSpace(parts[1]), nil
}
