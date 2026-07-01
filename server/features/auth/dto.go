package auth

import "czwlinux.cloud/go-friday-starter/features/user"

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type AuthResult struct {
	Token string    `json:"token"`
	User  *user.DTO `json:"user"`
}
