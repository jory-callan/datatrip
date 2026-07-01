package logger

import (
	"fmt"
	"os"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

type Logger struct {
	*zap.Logger
	config *ZapConfig
}

func NewLogger(config *ZapConfig) (*Logger, error) {
	core, err := buildCore(config)
	if err != nil {
		return nil, fmt.Errorf("failed to init logger: %w", err)
	}

	zl := zap.New(
		core,
		zap.AddCaller(),
		zap.AddCallerSkip(1),
		zap.AddStacktrace(zapcore.ErrorLevel),
	)
	zap.ReplaceGlobals(zl)

	return &Logger{Logger: zl, config: config}, nil
}

func buildCore(config *ZapConfig) (zapcore.Core, error) {
	level, err := zapcore.ParseLevel(config.Level)
	if err != nil {
		return nil, fmt.Errorf("invalid log level: %w", err)
	}

	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "time",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		FunctionKey:    zapcore.OmitKey,
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.LowercaseLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.StringDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}

	var encoder zapcore.Encoder
	switch config.Format {
	case "json":
		encoder = zapcore.NewJSONEncoder(encoderConfig)
	case "console", "text":
		encoder = zapcore.NewConsoleEncoder(encoderConfig)
	default:
		return nil, fmt.Errorf("unsupported log format: %s", config.Format)
	}

	cores := make([]zapcore.Core, 0, 2)
	if config.Output == "stdout" || config.Output == "both" || config.Output == "" {
		cores = append(cores, zapcore.NewCore(encoder, zapcore.Lock(os.Stdout), level))
	}

	if config.Output == "file" || config.Output == "both" {
		filePath := config.FilePath
		if filePath == "" {
			filePath = "logs/app.log"
		}
		fileWriter := zapcore.AddSync(&lumberjack.Logger{
			Filename:   filePath,
			MaxSize:    config.MaxSize,
			MaxBackups: config.MaxBackups,
			MaxAge:     config.MaxAge,
			Compress:   config.Compress,
		})
		cores = append(cores, zapcore.NewCore(encoder, fileWriter, level))
	}

	if len(cores) == 0 {
		cores = append(cores, zapcore.NewCore(encoder, zapcore.Lock(os.Stdout), level))
	}
	return zapcore.NewTee(cores...), nil
}

func (l *Logger) Sync() error {
	if l == nil || l.Logger == nil {
		return nil
	}
	return l.Logger.Sync()
}

func (l *Logger) WithFields(fields ...zap.Field) *Logger {
	return &Logger{Logger: l.Logger.With(fields...), config: l.config}
}

func (l *Logger) SugarLogger() *zap.SugaredLogger {
	if l == nil || l.Logger == nil {
		return zap.L().Sugar()
	}
	return l.Logger.Sugar()
}

type Field = zap.Field

func String(key, val string) Field                 { return zap.String(key, val) }
func Int(key string, val int) Field                { return zap.Int(key, val) }
func Error(err error) Field                        { return zap.Error(err) }
func Duration(key string, val time.Duration) Field { return zap.Duration(key, val) }
func Sugar() *zap.SugaredLogger                    { return zap.L().Sugar() }
