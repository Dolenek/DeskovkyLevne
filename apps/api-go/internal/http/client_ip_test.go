package http

import (
	"net/http"
	"net/http/httptest"
	"net/netip"
	"testing"
)

func TestTrustedClientIPUsesForwardedAddressFromTrustedPeer(t *testing.T) {
	trustedPrefix := netip.MustParsePrefix("192.0.2.0/24")
	handler := trustedClientIP([]netip.Prefix{trustedPrefix})(http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			_, _ = w.Write([]byte(clientIP(r)))
		},
	))
	request := httptest.NewRequest(http.MethodGet, "/", nil)
	request.RemoteAddr = "192.0.2.10:1234"
	request.Header.Set("CF-Connecting-IP", "203.0.113.9")
	recorder := httptest.NewRecorder()

	handler.ServeHTTP(recorder, request)
	if recorder.Body.String() != "203.0.113.9" {
		t.Fatalf("unexpected client IP %q", recorder.Body.String())
	}
}

func TestTrustedClientIPIgnoresSpoofedHeaderFromUntrustedPeer(t *testing.T) {
	handler := trustedClientIP(nil)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(clientIP(r)))
	}))
	request := httptest.NewRequest(http.MethodGet, "/", nil)
	request.RemoteAddr = "192.0.2.10:1234"
	request.Header.Set("CF-Connecting-IP", "203.0.113.9")
	recorder := httptest.NewRecorder()

	handler.ServeHTTP(recorder, request)
	if recorder.Body.String() != "192.0.2.10" {
		t.Fatalf("unexpected client IP %q", recorder.Body.String())
	}
}

func TestTrustedClientIPIgnoresSpoofedLeftmostForwardedAddress(t *testing.T) {
	trustedPrefix := netip.MustParsePrefix("192.0.2.0/24")
	handler := trustedClientIP([]netip.Prefix{trustedPrefix})(http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			_, _ = w.Write([]byte(clientIP(r)))
		},
	))
	request := httptest.NewRequest(http.MethodGet, "/", nil)
	request.RemoteAddr = "192.0.2.10:1234"
	request.Header.Set("X-Forwarded-For", "203.0.113.99, 198.51.100.8")
	recorder := httptest.NewRecorder()

	handler.ServeHTTP(recorder, request)
	if recorder.Body.String() != "198.51.100.8" {
		t.Fatalf("unexpected client IP %q", recorder.Body.String())
	}
}
