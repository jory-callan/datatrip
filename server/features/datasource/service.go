package datasource

import (
	"context"
	"errors"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"czwlinux.cloud/go-friday-starter/pkg/pipeline"
	"gorm.io/gorm"
)

var (
	ErrNotFound     = errors.New("datasource not found")
	ErrInvalidInput = errors.New("invalid input")
)

func ListDatasources(ctx context.Context, pq response.PageQuery, filters map[string]string) ([]*DTO, int64, error) {
	items, total, err := List(ctx, pq, filters)
	if err != nil {
		return nil, 0, err
	}
	result := make([]*DTO, 0, len(items))
	for i := range items {
		result = append(result, ToDTO(&items[i]))
	}
	return result, total, nil
}

func GetDatasource(ctx context.Context, id string) (*DTO, error) {
	if id == "" {
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

	// Auto-fill type group from built-in mapping
	typeGroup := string(pipeline.GetTypeGroup(dsType))

	d := &Datasource{
		Name:      name,
		Type:      dsType,
		TypeGroup: typeGroup,
		Host:      host,
		Port:      req.Port,
		Username:  username,
		Password:  req.Password,
		Database:  req.Database,
		Remark:    req.Remark,
		Status:    StatusDisconnected,
	}
	if err := Create(ctx, d); err != nil {
		return nil, err
	}
	return GetDatasource(ctx, d.ID)
}

func UpdateDatasource(ctx context.Context, id string, req UpdateRequest) (*DTO, error) {
	if id == "" {
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
		global.DB.WithContext(ctx).Model(d).Update("status", StatusDisconnected)
	}

	if err := Save(ctx, d); err != nil {
		return nil, err
	}
	return GetDatasource(ctx, d.ID)
}

func DeleteDatasource(ctx context.Context, id string) error {
	if id == "" {
		return ErrInvalidInput
	}
	err := DeleteByID(ctx, id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrNotFound
	}
	return err
}

func BatchDeleteDatasource(ctx context.Context, ids []string) error {
	cleanIDs := make([]string, 0, len(ids))
	for _, id := range ids {
		if strings.TrimSpace(id) != "" {
			cleanIDs = append(cleanIDs, strings.TrimSpace(id))
		}
	}
	if len(cleanIDs) == 0 {
		return ErrInvalidInput
	}
	return DeleteByIDs(ctx, cleanIDs)
}
