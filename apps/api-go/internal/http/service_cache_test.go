package http

import (
	"context"
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
