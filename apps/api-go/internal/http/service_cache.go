package http

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"
)

const singleflightLoadTimeout = 15 * time.Second

func fetchCached[T any](
	ctx context.Context,
	service *Service,
	groupPrefix string,
	cacheKey string,
	ttl time.Duration,
	load func(context.Context) (T, error),
) (T, error) {
	if cached, hit := readCache[T](ctx, service, cacheKey); hit {
		log.Printf("component=cache key=%s source=redis result=hit", cacheKey)
		return cached, nil
	}

	log.Printf("component=cache key=%s source=redis result=miss", cacheKey)
	return fetchWithinSingleflight(ctx, service, groupPrefix, cacheKey, ttl, load)
}

func fetchWithinSingleflight[T any](
	ctx context.Context,
	service *Service,
	groupPrefix string,
	cacheKey string,
	ttl time.Duration,
	load func(context.Context) (T, error),
) (T, error) {
	singleflightKey := fmt.Sprintf("%s:%s", groupPrefix, cacheKey)
	resultChannel := service.requests.DoChan(singleflightKey, func() (any, error) {
		loadContext, cancel := context.WithTimeout(
			context.WithoutCancel(ctx),
			singleflightLoadTimeout,
		)
		defer cancel()
		return loadOrReadCache(loadContext, service, cacheKey, ttl, load)
	})
	select {
	case <-ctx.Done():
		var zeroValue T
		return zeroValue, ctx.Err()
	case result := <-resultChannel:
		if result.Err != nil {
			var zeroValue T
			return zeroValue, result.Err
		}
		if result.Shared {
			log.Printf("component=singleflight key=%s shared=true", singleflightKey)
		}
		return asCachedValue[T](result.Val, cacheKey)
	}
}

func loadOrReadCache[T any](
	ctx context.Context,
	service *Service,
	cacheKey string,
	ttl time.Duration,
	load func(context.Context) (T, error),
) (T, error) {
	if cached, hit := readCache[T](ctx, service, cacheKey); hit {
		log.Printf("component=cache key=%s source=redis result=hit_within_singleflight", cacheKey)
		return cached, nil
	}

	startedAt := time.Now()
	loadedValue, loadErr := load(ctx)
	elapsedMs := time.Since(startedAt).Milliseconds()
	if loadErr != nil {
		log.Printf("component=db_fetch key=%s duration_ms=%d result=error", cacheKey, elapsedMs)
		var zeroValue T
		return zeroValue, loadErr
	}
	log.Printf("component=db_fetch key=%s duration_ms=%d result=ok", cacheKey, elapsedMs)
	service.writeCache(ctx, cacheKey, loadedValue, ttl)
	return loadedValue, nil
}

func asCachedValue[T any](value any, cacheKey string) (T, error) {
	typedValue, ok := value.(T)
	if !ok {
		var zeroValue T
		return zeroValue, fmt.Errorf("cache singleflight type mismatch for key %q", cacheKey)
	}
	return typedValue, nil
}

func readCache[T any](ctx context.Context, service *Service, key string) (T, bool) {
	var zeroValue T
	if service.cacheClient == nil {
		return zeroValue, false
	}

	payload, hit, err := service.cacheClient.Get(ctx, service.namespacedCacheKey(key))
	if err != nil {
		log.Printf("component=cache key=%s operation=get result=error error=%q", key, err)
		return zeroValue, false
	}
	if !hit {
		return zeroValue, false
	}

	var target T
	if unmarshalErr := json.Unmarshal([]byte(payload), &target); unmarshalErr != nil {
		log.Printf(
			"component=cache key=%s operation=unmarshal result=error error=%q",
			key,
			unmarshalErr,
		)
		return zeroValue, false
	}
	return target, true
}

func (s *Service) writeCache(ctx context.Context, key string, value any, ttl time.Duration) {
	if s.cacheClient == nil || ttl <= 0 {
		return
	}

	payload, err := json.Marshal(value)
	if err != nil {
		log.Printf("component=cache key=%s operation=marshal result=error error=%q", key, err)
		return
	}
	if err := s.cacheClient.Set(ctx, s.namespacedCacheKey(key), string(payload), ttl); err != nil {
		log.Printf("component=cache key=%s operation=set result=error error=%q", key, err)
	}
}

func (s *Service) namespacedCacheKey(key string) string {
	if s.cacheNamespace == "" {
		return key
	}
	return s.cacheNamespace + ":" + key
}
