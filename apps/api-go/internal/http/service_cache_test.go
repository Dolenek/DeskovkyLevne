package http

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestSingleflightLoadSurvivesLeaderCancellation(t *testing.T) {
	service := &Service{cacheNamespace: "test"}
	loadStarted := make(chan struct{})
	releaseLoad := make(chan struct{})
	var startSignal sync.Once
	var loadCalls atomic.Int32
	load := func(context.Context) (int, error) {
		loadCalls.Add(1)
		startSignal.Do(func() { close(loadStarted) })
		<-releaseLoad
		return 42, nil
	}

	leaderContext, cancelLeader := context.WithCancel(context.Background())
	leaderResult := make(chan error, 1)
	go func() {
		_, err := fetchCached(leaderContext, service, "test", "shared", time.Minute, load)
		leaderResult <- err
	}()
	<-loadStarted

	followerResult := make(chan int, 1)
	go func() {
		value, _ := fetchCached(context.Background(), service, "test", "shared", time.Minute, load)
		followerResult <- value
	}()
	time.Sleep(10 * time.Millisecond)
	cancelLeader()
	close(releaseLoad)

	if err := <-leaderResult; err != context.Canceled {
		t.Fatalf("expected leader cancellation, got %v", err)
	}
	if value := <-followerResult; value != 42 {
		t.Fatalf("expected follower value 42, got %d", value)
	}
	if calls := loadCalls.Load(); calls != 1 {
		t.Fatalf("expected one shared load, got %d", calls)
	}
}

func TestFloatCacheKeysPreserveExactFilterValue(t *testing.T) {
	first := 1.00001
	second := 1.00002
	if floatPtrKey(&first) == floatPtrKey(&second) {
		t.Fatal("distinct filter values must not share a cache key")
	}
}

func TestEncodedJoinKeepsOpaqueProductCodeSetsDistinct(t *testing.T) {
	combinedCode := encodedJoin([]string{"A|B"})
	separateCodes := encodedJoin([]string{"A", "B"})
	if combinedCode == separateCodes {
		t.Fatal("different product-code sets must not share a cache key")
	}
}

func TestFetchCachedUsesValidHitWithoutCallingLoader(t *testing.T) {
	cacheClient := newRecordingCache()
	cacheClient.values["test:answer"] = "42"
	service := &Service{cacheClient: cacheClient, cacheNamespace: "test"}
	loadCalls := 0

	value, err := fetchCached(
		context.Background(),
		service,
		"numbers",
		"answer",
		time.Minute,
		func(context.Context) (int, error) {
			loadCalls++
			return 7, nil
		},
	)
	if err != nil || value != 42 {
		t.Fatalf("unexpected cached result: value=%d err=%v", value, err)
	}
	if loadCalls != 0 {
		t.Fatalf("cache hit called loader %d times", loadCalls)
	}
}

func TestFetchCachedRecoversFromInvalidJSONAndCacheReadErrors(t *testing.T) {
	tests := []struct {
		name      string
		configure func(*recordingCache)
	}{
		{
			name: "invalid JSON",
			configure: func(cacheClient *recordingCache) {
				cacheClient.values["test:answer"] = "not-json"
			},
		},
		{
			name: "cache read error",
			configure: func(cacheClient *recordingCache) {
				cacheClient.getError = errors.New("redis unavailable")
			},
		},
	}

	for _, testCase := range tests {
		t.Run(testCase.name, func(t *testing.T) {
			cacheClient := newRecordingCache()
			testCase.configure(cacheClient)
			service := &Service{cacheClient: cacheClient, cacheNamespace: "test"}
			loadCalls := 0

			value, err := fetchCached(
				context.Background(), service, "numbers", "answer", time.Minute,
				func(context.Context) (int, error) {
					loadCalls++
					return 7, nil
				},
			)
			if err != nil || value != 7 || loadCalls != 1 {
				t.Fatalf("unexpected fallback: value=%d loads=%d err=%v", value, loadCalls, err)
			}
			if cacheClient.setCalls != 1 {
				t.Fatalf("expected refreshed cache write, got %d", cacheClient.setCalls)
			}
		})
	}
}

func TestFetchCachedIgnoresCacheWriteFailure(t *testing.T) {
	cacheClient := newRecordingCache()
	cacheClient.setError = errors.New("redis read-only")
	service := &Service{cacheClient: cacheClient, cacheNamespace: "test"}

	value, err := fetchCached(
		context.Background(), service, "numbers", "answer", time.Minute,
		func(context.Context) (int, error) { return 7, nil },
	)
	if err != nil || value != 7 {
		t.Fatalf("cache write failure changed response: value=%d err=%v", value, err)
	}
}

func TestFetchCachedDoesNotCacheLoaderErrors(t *testing.T) {
	cacheClient := newRecordingCache()
	service := &Service{cacheClient: cacheClient, cacheNamespace: "test"}
	loadError := errors.New("database unavailable")

	_, err := fetchCached(
		context.Background(), service, "numbers", "answer", time.Minute,
		func(context.Context) (int, error) { return 0, loadError },
	)
	if !errors.Is(err, loadError) {
		t.Fatalf("unexpected loader error: %v", err)
	}
	if cacheClient.setCalls != 0 {
		t.Fatalf("failed load wrote cache %d times", cacheClient.setCalls)
	}
}
