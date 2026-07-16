package pipeline

import (
	"context"
	"fmt"
)

// Parser 将原始文本解析为指令列表
type Parser interface {
	Types() []DataSourceType
	Parse(ctx context.Context, dsType string, raw string) ([]Instruction, error)
}

// Executor 执行指令并返回结果（可选实现，当前未强制）
type Executor interface {
	Type() DataSourceType
	Execute(ctx context.Context, conn any, inst Instruction) (any, error)
}

// RuleResult 规则引擎判定结果
type RuleResult struct {
	Action     RuleAction
	RuleName   string
	Matched    bool
	Overridden bool
}

type RuleAction string

const (
	RuleActionAllow  RuleAction = "allow"
	RuleActionTicket RuleAction = "require_ticket"
	RuleActionBlock  RuleAction = "block"
)

// RuleEngine 规则引擎接口（由 dsrule 实现）
type RuleEngine interface {
	Evaluate(ctx context.Context, dsType, dsGroup string, insts []Instruction) ([]RuleResult, error)
}

// PermissionChecker 资源级权限检查扩展点（默认透传）
type PermissionChecker interface {
	Check(ctx context.Context, userID string, inst Instruction) (bool, error)
}

// DecisionSummary 决策摘要
type DecisionSummary struct {
	HasDangerous bool `json:"has_dangerous"`
	HasWrite     bool `json:"has_write"`
	HasUnknown   bool `json:"has_unknown"`
	AllRead      bool `json:"all_read"`
}

// ClassifyResult 分类结果（Pipeline 的输出，供上层使用）
type ClassifyResult struct {
	Instructions []Instruction   `json:"instructions"`
	Results      []RuleResult    `json:"-"`
	Decisions    []string        `json:"decisions"`
	Summary      DecisionSummary `json:"summary"`
}

// Pipeline 指令分类管道：Parse → RuleEngine → PermissionCheck → 决策摘要
type Pipeline struct {
	parsers    map[DataSourceType]Parser
	ruleEngine RuleEngine
	permCheck  PermissionChecker
}

func NewPipeline(ruleEngine RuleEngine) *Pipeline {
	return &Pipeline{
		parsers:    make(map[DataSourceType]Parser),
		ruleEngine: ruleEngine,
		permCheck:  &defaultPermissionChecker{},
	}
}

func (p *Pipeline) RegisterParser(parser Parser) {
	if parser != nil {
		for _, t := range parser.Types() {
			p.parsers[t] = parser
		}
	}
}

func (p *Pipeline) SetRuleEngine(engine RuleEngine) {
	p.ruleEngine = engine
}

func (p *Pipeline) SetPermissionChecker(checker PermissionChecker) {
	p.permCheck = checker
}

// Classify 执行完整管道，返回分类决策摘要
func (p *Pipeline) Classify(ctx context.Context, dsType, dsGroup, raw, userID string) (*ClassifyResult, error) {
	parser, ok := p.parsers[DataSourceType(dsType)]
	if !ok {
		return nil, fmt.Errorf("unsupported datasource type: %s", dsType)
	}

	insts, err := parser.Parse(ctx, dsType, raw)
	if err != nil {
		return nil, fmt.Errorf("parse failed: %w", err)
	}
	if len(insts) == 0 {
		return nil, fmt.Errorf("no valid statements")
	}

	// 填充 TypeGroup（所有 Instruction 共享同一个 dsGroup）
	for i := range insts {
		insts[i].TypeGroup = dsGroup
	}

	results, err := p.ruleEngine.Evaluate(ctx, dsType, dsGroup, insts)
	if err != nil {
		return nil, fmt.Errorf("rule engine failed: %w", err)
	}

	summary := DecisionSummary{}
	decisions := make([]string, len(insts))

	for i := range insts {
		// 应用 RuleEngine 覆盖
		if i < len(results) && results[i].Overridden {
			switch results[i].Action {
			case RuleActionBlock:
				insts[i].OpType = OpDangerous
			case RuleActionTicket:
				insts[i].OpType = OpWrite
			case RuleActionAllow:
				insts[i].OpType = OpRead
			}
		}

		// PermissionCheck
		if p.permCheck != nil && userID != "" {
			ok, err := p.permCheck.Check(ctx, userID, insts[i])
			if err != nil {
				return nil, fmt.Errorf("permission check failed: %w", err)
			}
			if !ok {
				insts[i].OpType = OpDangerous
			}
		}

		switch insts[i].OpType {
		case OpDangerous:
			summary.HasDangerous = true
			decisions[i] = "block"
		case OpWrite:
			summary.HasWrite = true
			decisions[i] = "ticket"
		case OpUnknown:
			summary.HasUnknown = true
			decisions[i] = "unknown"
		default:
			decisions[i] = "allow"
		}
	}
	if !summary.HasDangerous && !summary.HasWrite && !summary.HasUnknown {
		summary.AllRead = true
	}

	return &ClassifyResult{
		Instructions: insts,
		Results:      results,
		Decisions:    decisions,
		Summary:      summary,
	}, nil
}

type defaultPermissionChecker struct{}

func (d *defaultPermissionChecker) Check(_ context.Context, _ string, _ Instruction) (bool, error) {
	return true, nil
}
