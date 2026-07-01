package validator

import (
	"github.com/go-playground/validator/v10"
	"regexp"
)

var (
	// 手机号验证
	MobileRegex = regexp.MustCompile(`^1[3-9]\d{9}$`)
	// 用户名验证（字母数字下划线，3-20位）
	UsernameRegex = regexp.MustCompile(`^[a-zA-Z0-9_]{3,20}$`)
	// 密码强度验证（至少8位，包含字母和数字）
	PasswordRegex = regexp.MustCompile(`^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$`)
)

// 自定义验证标签
var customValidations = map[string]validator.Func{
	"mobile":   validateMobile,
	"username": validateUsername,
	"password": validatePassword,
	"idcard":   validateIDCard,
}

// 初始化自定义验证器
func InitCustomValidator(v *validator.Validate) {
	for tag, fn := range customValidations {
		v.RegisterValidation(tag, fn)
	}
}

// 手机号验证
func validateMobile(fl validator.FieldLevel) bool {
	mobile, ok := fl.Field().Interface().(string)
	if !ok {
		return false
	}
	return MobileRegex.MatchString(mobile)
}

// 用户名验证
func validateUsername(fl validator.FieldLevel) bool {
	username, ok := fl.Field().Interface().(string)
	if !ok {
		return false
	}
	return UsernameRegex.MatchString(username)
}

// 密码强度验证
func validatePassword(fl validator.FieldLevel) bool {
	password, ok := fl.Field().Interface().(string)
	if !ok {
		return false
	}
	return PasswordRegex.MatchString(password)
}

// 身份证号验证（简单版本）
func validateIDCard(fl validator.FieldLevel) bool {
	idCard, ok := fl.Field().Interface().(string)
	if !ok {
		return false
	}
	// 更复杂的身份证验证逻辑
	regex := regexp.MustCompile(`^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$`)
	return regex.MatchString(idCard)
}
