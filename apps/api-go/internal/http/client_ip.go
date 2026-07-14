package http

import (
	"context"
	"net"
	"net/http"
	"net/netip"
	"strings"
)

type clientIPContextKey struct{}

func trustedClientIP(trustedPrefixes []netip.Prefix) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			resolvedIP := immediatePeerIP(r.RemoteAddr)
			if isTrustedProxy(resolvedIP, trustedPrefixes) {
				resolvedIP = forwardedClientIP(r.Header, resolvedIP, trustedPrefixes)
			}
			ctx := context.WithValue(r.Context(), clientIPContextKey{}, resolvedIP)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func clientIP(r *http.Request) string {
	if address, ok := r.Context().Value(clientIPContextKey{}).(netip.Addr); ok {
		return address.String()
	}
	return immediatePeerIP(r.RemoteAddr).String()
}

func immediatePeerIP(remoteAddress string) netip.Addr {
	host, _, err := net.SplitHostPort(remoteAddress)
	if err != nil {
		host = remoteAddress
	}
	address, _ := netip.ParseAddr(strings.TrimSpace(host))
	return address.Unmap()
}

func isTrustedProxy(address netip.Addr, trustedPrefixes []netip.Prefix) bool {
	if !address.IsValid() {
		return false
	}
	for _, prefix := range trustedPrefixes {
		if prefix.Contains(address) {
			return true
		}
	}
	return false
}

func forwardedClientIP(
	headers http.Header,
	fallback netip.Addr,
	trustedPrefixes []netip.Prefix,
) netip.Addr {
	if address := parseForwardedIP(headers.Get("CF-Connecting-IP")); address.IsValid() {
		return address
	}
	forwardedChain := strings.Split(headers.Get("X-Forwarded-For"), ",")
	for index := len(forwardedChain) - 1; index >= 0; index-- {
		address := parseForwardedIP(forwardedChain[index])
		if !address.IsValid() {
			return fallback
		}
		if !isTrustedProxy(address, trustedPrefixes) {
			return address
		}
	}
	return fallback
}

func parseForwardedIP(value string) netip.Addr {
	address, _ := netip.ParseAddr(strings.TrimSpace(value))
	return address.Unmap()
}
