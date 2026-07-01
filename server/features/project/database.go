package project

import "path/filepath"

// MatchDatabase checks if a database name matches a pattern that may contain * and ? wildcards.
//   - "*" matches any single database name
//   - "user*" matches "user-test", "user_prod", "user123" etc.
//   - "*_prod" matches "db_prod", "user_prod" etc.
//   - "dev_*_test" matches "dev_api_test" etc.
func MatchDatabase(pattern, dbName string) bool {
	matched, err := filepath.Match(pattern, dbName)
	return err == nil && matched
}

// IsDatabaseAllowed checks if a database name is allowed by any pattern in the project's database list.
func IsDatabaseAllowed(allowedPatterns []string, dbName string) bool {
	for _, pattern := range allowedPatterns {
		if MatchDatabase(pattern, dbName) {
			return true
		}
	}
	return false
}

// HasWildcard checks if any pattern in the list contains a wildcard character.
func HasWildcard(patterns []string) bool {
	for _, p := range patterns {
		if containsWildcard(p) {
			return true
		}
	}
	return false
}

// SplitDatabases splits the comma-separated databases string from DbProject into a slice.
// Exported so other packages (sqlexec, etc.) can parse project databases for validation.
func SplitDatabases(dbs string) []string {
	return splitStrings(dbs)
}

func containsWildcard(s string) bool {
	for _, c := range s {
		if c == '*' || c == '?' || c == '[' {
			return true
		}
	}
	return false
}
