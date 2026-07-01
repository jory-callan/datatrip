package sliceutil

// 去重
func Unique[T comparable](slice []T) []T {
	seen := make(map[T]bool)
	result := []T{}
	for _, v := range slice {
		if !seen[v] {
			seen[v] = true
			result = append(result, v)
		}
	}
	return result
}

// 过滤
func Filter[T any](slice []T, test func(T) bool) []T {
	result := []T{}
	for _, v := range slice {
		if test(v) {
			result = append(result, v)
		}
	}
	return result
}
