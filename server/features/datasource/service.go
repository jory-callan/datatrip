package datasource

import (
	"context"
	"errors"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
	"gorm.io/gorm"
)

var (
	ErrNotFound     = errors.New("datasource not found")
	ErrInvalidInput = errors.New("invalid input")
)

func ListDatasources(ctx context.Context, query ListQuery) ([]*DTO, int64, error) {
	query.Normalize()
	items, total, err := List(ctx, query)
	if err != nil {
		return nil, 0, err
	}
	result := make([]*DTO, 0, len(items))
	for i := range items {
		result = append(result, ToDTO(&items[i]))
	}
	return result, total, nil
}

func GetDatasource(ctx context.Context, id uint) (*DTO, error) {
	if id == 0 {
		return nil, ErrInvalidInput
	}
	d, err := GetByID(ctx, id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return ToDTO(d), nil
}

func CreateDatasource(ctx context.Context, req CreateRequest) (*DTO, error) {
	name := strings.TrimSpace(req.Name)
	dsType := strings.TrimSpace(req.Type)
	host := strings.TrimSpace(req.Host)
	username := strings.TrimSpace(req.Username)

	if name == "" || dsType == "" || host == "" || username == "" {
		return nil, ErrInvalidInput
	}
	if req.Port <= 0 {
		return nil, ErrInvalidInput
	}

	d := &Datasource{
		Name:     name,
		Type:     dsType,
		Host:     host,
		Port:     req.Port,
		Username: username,
		Password: req.Password,
		Database: req.Database,
		Remark:   req.Remark,
		Status:   StatusDisconnected,
	}
	if err := Create(ctx, d); err != nil {
		return nil, err
	}
	return GetDatasource(ctx, d.ID)
}

func UpdateDatasource(ctx context.Context, id uint, req UpdateRequest) (*DTO, error) {
	if id == 0 {
		return nil, ErrInvalidInput
	}
	d, err := GetByID(ctx, id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	if req.Name != "" {
		d.Name = req.Name
	}
	if req.Host != "" {
		d.Host = req.Host
	}
	if req.Port > 0 {
		d.Port = req.Port
	}
	if req.Username != "" {
		d.Username = req.Username
	}
	if req.Password != "" {
		d.Password = req.Password
	}
	if req.Status != "" {
		d.Status = req.Status
	}
	d.Remark = req.Remark

	// 连接信息变更后重置状态为 disconnected
	if req.Host != "" || req.Port > 0 || req.Username != "" || req.Password != "" {
		d.Status = StatusDisconnected
		// 关闭旧连接池
		global.DB.WithContext(ctx).Model(d).Update("status", StatusDisconnected)
	}

	if err := Save(ctx, d); err != nil {
		return nil, err
	}
	return GetDatasource(ctx, d.ID)
}

func DeleteDatasource(ctx context.Context, id uint) error {
	if id == 0 {
		return ErrInvalidInput
	}
	err := DeleteByID(ctx, id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrNotFound
	}
	return err
}
