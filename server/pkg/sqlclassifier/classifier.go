package sqlclassifier

import (
	"regexp"
	"strings"
)

// Result holds the classification result for a single SQL statement.
type Result struct {
	Operation   string `json:"operation"`    // select/insert/update/delete/create/alter/drop/truncate/unknown
	IsRead      bool   `json:"is_read"`      // true for SELECT
	IsDangerous bool   `json:"is_dangerous"` // true for DROP/TRUNCATE/ALTER
	IsUnknown   bool   `json:"is_unknown"`   // true if no keyword matched at all
	MatchedRule string `json:"matched_rule"` // name of the matched built-in rule
}

var keywordPatterns = []struct {
	keyword   string
	read      bool
	dangerous bool
}{
	{`^\s*SELECT\b`, true, false},
	{`^\s*INSERT\b`, false, false},
	{`^\s*UPDATE\b`, false, false},
	{`^\s*DELETE\b`, false, false},
	{`^\s*CREATE\b`, false, true},
	{`^\s*ALTER\b`, false, true},
	{`^\s*DROP\b`, false, true},
	{`^\s*TRUNCATE\b`, false, true},
}

// Classify classifies a single SQL statement and returns the result.
func Classify(sql string) Result {
	s := strings.TrimSpace(sql)
	if s == "" {
		return Result{Operation: "unknown", IsRead: false, IsDangerous: false, IsUnknown: true, MatchedRule: ""}
	}

	upper := strings.ToUpper(s)
	for _, kp := range keywordPatterns {
		re := regexp.MustCompile(kp.keyword)
		if re.MatchString(upper) {
			op := strings.ToLower(strings.TrimSpace(re.FindString(upper)))
			return Result{
				Operation:   op,
				IsRead:      kp.read,
				IsDangerous: kp.dangerous,
				MatchedRule: op,
			}
		}
	}
	return Result{Operation: "unknown", IsRead: false, IsDangerous: false, IsUnknown: true, MatchedRule: ""}
}

// IsWriteOperation returns true if the SQL is a write operation (not SELECT and not unknown).
func IsWriteOperation(sql string) bool {
	r := Classify(sql)
	return !r.IsRead && !r.IsUnknown
}
