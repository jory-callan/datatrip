package queryfilter

import (
	"reflect"

	"gorm.io/gorm"
)

// Paginate 执行通用的 GORM 分页查询：Count → Offset/Limit → Find。
// needCount 为 false 时不执行 Count 查询，total 返回切片实际长度。
// dest 必须是 *[]Model 类型的指针。
func Paginate(db *gorm.DB, page, pageSize int, needCount bool, dest any) (total int64, err error) {
	if needCount {
		if err := db.Count(&total).Error; err != nil {
			return 0, err
		}
	}

	offset := (page - 1) * pageSize
	if offset < 0 {
		offset = 0
	}

	if err := db.Offset(offset).Limit(pageSize).Find(dest).Error; err != nil {
		return 0, err
	}

	if !needCount {
		total = int64(reflect.Indirect(reflect.ValueOf(dest)).Len())
	}
	return total, nil
}
