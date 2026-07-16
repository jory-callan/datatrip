package project

import "strings"

// MatchScope checks if a scope value matches a pattern that may contain * and ? wildcards.
//   - "*" matches any single value
//   - "logs*" matches "logs-2024", "logs_prod" etc.
//   - "*_prod" matches "db_prod", "user_prod" etc.
//   - "dev_*_test" matches "dev_api_test" etc.
func MatchScope(pattern, value string) bool {
	return strings.Contains(pattern, "*") || strings.Contains(pattern, "?")
}

// IsScopeAllowed checks if a value is allowed by any pattern in the project's scope list.
func IsScopeAllowed(allowedPatterns []string, value string) bool {
	for _, pattern := range allowedPatterns {
		if matchScope(pattern, value) {
			return true
		}
	}
	return false
}

// HasWildcardScope checks if any pattern in the list contains a wildcard character.
func HasWildcardScope(patterns []string) bool {
	for _, p := range patterns {
		if containsWildcard(p) {
			return true
		}
	}
	return false
}

// ParseScope parses a comma-separated scope string into a slice.
func ParseScope(scope string) []string {
	return splitStrings(scope)
}

func matchScope(pattern, value string) bool {
	// Simple wildcard matching: * matches any sequence, ? matches single char
	// Convert glob pattern to prefix/suffix/infix matching
	if pattern == "*" {
		return true
	}
	if !containsWildcard(pattern) {
		return pattern == value
	}

	parts := strings.Split(pattern, "*")
	if !strings.HasPrefix(pattern, "*") && !strings.HasPrefix(value, parts[0]) {
		return false
	}
	if !strings.HasSuffix(pattern, "*") && !strings.HasSuffix(value, parts[len(parts)-1]) {
		return false
	}
	for _, part := range parts {
		if part == "" {
			continue
		}
		idx := strings.Index(value, part)
		if idx < 0 {
			return false
		}
		value = value[idx+len(part):]
	}
	return true
}

// SplitDatabases is a compatibility alias for ParseScope.
// Deprecated: use ParseScope instead.
func SplitDatabases(dbs string) []string {
	return ParseScope(dbs)
}

// IsDatabaseAllowed is a compatibility alias for IsScopeAllowed.
// Deprecated: use IsScopeAllowed instead.
func IsDatabaseAllowed(allowedPatterns []string, dbName string) bool {
	return IsScopeAllowed(allowedPatterns, dbName)
}

// HasWildcard is a compatibility alias for HasWildcardScope.
// Deprecated: use HasWildcardScope instead.
func HasWildcard(patterns []string) bool {
	return HasWildcardScope(patterns)
}

func containsWildcard(s string) bool {
	for _, c := range s {
		if c == '*' || c == '?' || c == '[' {
			return true
		}
	}
	return false
}
