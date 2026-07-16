package parser

import (
	"context"
	"strings"

	"czwlinux.cloud/go-friday-starter/pkg/pipeline"
)

// redisCommands maps Redis commands to their classification
var redisCommands = map[string]struct {
	opType  pipeline.OpType
	read    bool
	comment string
}{
	// Read commands
	"GET":       {pipeline.OpRead, true, "获取 key 的值"},
	"MGET":      {pipeline.OpRead, true, "批量获取"},
	"KEYS":      {pipeline.OpRead, true, "查询 key（生产慎用）"},
	"SCAN":      {pipeline.OpRead, true, "游标遍历 key"},
	"EXISTS":    {pipeline.OpRead, true, "检查 key 是否存在"},
	"TTL":       {pipeline.OpRead, true, "查询过期时间"},
	"PTTL":      {pipeline.OpRead, true, "查询过期时间(毫秒)"},
	"TYPE":      {pipeline.OpRead, true, "查询类型"},
	"HGET":      {pipeline.OpRead, true, "获取 hash 字段"},
	"HGETALL":   {pipeline.OpRead, true, "获取全部 hash 字段"},
	"HMGET":     {pipeline.OpRead, true, "批量获取 hash 字段"},
	"HLEN":      {pipeline.OpRead, true, "hash 字段数量"},
	"HEXISTS":   {pipeline.OpRead, true, "hash 字段是否存在"},
	"LINDEX":    {pipeline.OpRead, true, "获取 list 元素"},
	"LLEN":      {pipeline.OpRead, true, "list 长度"},
	"LRANGE":    {pipeline.OpRead, true, "获取 list 范围"},
	"SMEMBERS":  {pipeline.OpRead, true, "获取 set 所有成员"},
	"SISMEMBER": {pipeline.OpRead, true, "set 成员是否存在"},
	"SCARD":     {pipeline.OpRead, true, "set 基数"},
	"ZRANGE":    {pipeline.OpRead, true, "获取 sorted set 范围"},
	"ZCARD":     {pipeline.OpRead, true, "sorted set 基数"},
	"ZSCORE":    {pipeline.OpRead, true, "获取 sorted set 分数"},
	"STRLEN":    {pipeline.OpRead, true, "字符串长度"},
	"DUMP":      {pipeline.OpRead, true, "序列化 key"},
	"OBJECT":    {pipeline.OpRead, true, "对象内省"},
	"INFO":      {pipeline.OpRead, true, "服务器信息"},
	"DBSIZE":    {pipeline.OpRead, true, "数据库 key 数量"},

	// Write commands
	"SET":      {pipeline.OpWrite, false, "设置 key"},
	"SETEX":    {pipeline.OpWrite, false, "设置 key+过期"},
	"PSETEX":   {pipeline.OpWrite, false, "设置 key+过期(毫秒)"},
	"SETNX":    {pipeline.OpWrite, false, "不存在时设置"},
	"MSET":     {pipeline.OpWrite, false, "批量设置"},
	"DEL":      {pipeline.OpWrite, false, "删除 key"},
	"HDEL":     {pipeline.OpWrite, false, "删除 hash 字段"},
	"HSET":     {pipeline.OpWrite, false, "设置 hash 字段"},
	"HMSET":    {pipeline.OpWrite, false, "批量设置 hash"},
	"LPUSH":    {pipeline.OpWrite, false, "list 左推"},
	"RPUSH":    {pipeline.OpWrite, false, "list 右推"},
	"LPOP":     {pipeline.OpWrite, false, "list 左弹"},
	"RPOP":     {pipeline.OpWrite, false, "list 右弹"},
	"SADD":     {pipeline.OpWrite, false, "set 添加"},
	"SREM":     {pipeline.OpWrite, false, "set 移除"},
	"ZADD":     {pipeline.OpWrite, false, "sorted set 添加"},
	"ZREM":     {pipeline.OpWrite, false, "sorted set 移除"},
	"EXPIRE":   {pipeline.OpWrite, false, "设置过期时间"},
	"EXPIREAT": {pipeline.OpWrite, false, "设置过期时间戳"},
	"PERSIST":  {pipeline.OpWrite, false, "移除过期时间"},
	"RENAME":   {pipeline.OpWrite, false, "重命名 key"},
	"RENAMENX": {pipeline.OpWrite, false, "不存在时重命名"},
	"FLUSHDB":  {pipeline.OpWrite, false, "清空当前 DB"},
	"LTRIM":    {pipeline.OpWrite, false, "list 裁剪"},

	// Dangerous commands
	"FLUSHALL":     {pipeline.OpDangerous, false, "清空所有 DB"},
	"SHUTDOWN":     {pipeline.OpDangerous, false, "关闭服务器"},
	"DEBUG":        {pipeline.OpDangerous, false, "调试命令"},
	"CONFIG SET":   {pipeline.OpDangerous, false, "修改配置"},
	"SLAVEOF":      {pipeline.OpDangerous, false, "修改主从"},
	"REPLICAOF":    {pipeline.OpDangerous, false, "修改复制"},
	"CLUSTER":      {pipeline.OpDangerous, false, "集群管理"},
	"BGREWRITEAOF": {pipeline.OpWrite, false, "AOF 重写"},
	"BGSAVE":       {pipeline.OpWrite, false, "后台保存"},
	"SAVE":         {pipeline.OpWrite, false, "阻塞保存"},
}

// RedisParser 实现了 pipeline.Parser 接口
type RedisParser struct{}

func NewRedisParser() *RedisParser {
	return &RedisParser{}
}

func (p *RedisParser) Types() []pipeline.DataSourceType {
	return []pipeline.DataSourceType{
		pipeline.DsRedis,
	}
}

func (p *RedisParser) Parse(_ context.Context, dsType string, raw string) ([]pipeline.Instruction, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, nil
	}

	// Split by newlines for multi-command support
	lines := strings.Split(raw, "\n")
	var result []pipeline.Instruction

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Extract the command (first word)
		upper := strings.ToUpper(line)
		parts := strings.Fields(upper)
		if len(parts) == 0 {
			continue
		}

		cmd := parts[0]
		def, found := redisCommands[cmd]
		if !found {
			// Unknown command → OpUnknown
			result = append(result, pipeline.Instruction{
				Type:    pipeline.DataSourceType(dsType),
				Command: cmd,
				Args:    extractRedisArgs(line),
				Raw:     line,
				OpType:  pipeline.OpUnknown,
			})
			continue
		}

		result = append(result, pipeline.Instruction{
			Type:    pipeline.DataSourceType(dsType),
			Command: cmd,
			Args:    extractRedisArgs(line),
			Raw:     line,
			OpType:  def.opType,
		})
	}

	return result, nil
}

func extractRedisArgs(raw string) []string {
	parts := strings.Fields(raw)
	if len(parts) <= 1 {
		return nil
	}
	// Return everything after the command
	args := parts[1:]
	if len(args) > 10 {
		args = args[:10]
	}
	return args
}
