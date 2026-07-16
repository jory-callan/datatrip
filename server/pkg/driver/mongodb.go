package driver

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

// ConnectMongo 根据 ConnConfig 连接 MongoDB，返回客户端。
func ConnectMongo(ctx context.Context, cfg ConnConfig) (*mongo.Client, error) {
	uri := fmt.Sprintf("mongodb://%s:%s@%s:%d/%s",
		cfg.Username, cfg.Password, cfg.Host, cfg.Port, cfg.Database)
	if cfg.Username == "" {
		uri = fmt.Sprintf("mongodb://%s:%d/%s", cfg.Host, cfg.Port, cfg.Database)
	}

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, fmt.Errorf("mongo connect: %w", err)
	}
	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		client.Disconnect(ctx)
		return nil, fmt.Errorf("mongo ping: %w", err)
	}
	return client, nil
}

// ListMongoDatabases 列出 MongoDB 上的所有数据库。
func ListMongoDatabases(ctx context.Context, client *mongo.Client) ([]string, error) {
	dbs, err := client.ListDatabaseNames(ctx, struct{}{})
	if err != nil {
		return nil, err
	}
	return dbs, nil
}

// ListMongoCollections 列出指定数据库的所有集合。
func ListMongoCollections(ctx context.Context, client *mongo.Client, database string) ([]string, error) {
	cols, err := client.Database(database).ListCollectionNames(ctx, struct{}{})
	if err != nil {
		return nil, err
	}
	return cols, nil
}
