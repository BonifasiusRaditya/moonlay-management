package sharedauth

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"sync"
	"time"
)

type KeyProvider interface {
	GetPublicKey(ctx context.Context, kid string) (*rsa.PublicKey, error)
}

type JWKS struct {
	Keys []JWK `json:"keys"`
}

type JWK struct {
	KeyType string `json:"kty"`
	KeyID   string `json:"kid"`
	Alg     string `json:"alg"`
	Use     string `json:"use"`
	Modulus string `json:"n"`
	Expo    string `json:"e"`
}

type JWKSCache struct {
	url       string
	ttl       time.Duration
	client    *http.Client
	mu        sync.RWMutex
	jwks      *JWKS
	fetchedAt time.Time
}

func NewJWKSCache(url string, ttl time.Duration, client *http.Client) *JWKSCache {
	if ttl == 0 {
		ttl = 5 * time.Minute
	}
	if client == nil {
		client = &http.Client{Timeout: 10 * time.Second}
	}
	return &JWKSCache{
		url:    url,
		ttl:    ttl,
		client: client,
	}
}

func (c *JWKSCache) GetPublicKey(ctx context.Context, kid string) (*rsa.PublicKey, error) {
	jwks, err := c.getJWKS(ctx)
	if err != nil {
		return nil, err
	}
	for _, key := range jwks.Keys {
		if key.KeyID == kid {
			return key.toPublicKey()
		}
	}
	return nil, fmt.Errorf("jwks key not found: %s", kid)
}

func (c *JWKSCache) getJWKS(ctx context.Context) (*JWKS, error) {
	c.mu.RLock()
	jwks := c.jwks
	expired := jwks == nil || time.Since(c.fetchedAt) > c.ttl
	c.mu.RUnlock()

	if !expired {
		return jwks, nil
	}

	c.mu.Lock()
	defer c.mu.Unlock()
	if c.jwks != nil && time.Since(c.fetchedAt) <= c.ttl {
		return c.jwks, nil
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("jwks fetch failed: %s", resp.Status)
	}

	var payload JWKS
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, err
	}

	c.jwks = &payload
	c.fetchedAt = time.Now()
	return c.jwks, nil
}

func (j JWK) toPublicKey() (*rsa.PublicKey, error) {
	if j.KeyType != "RSA" {
		return nil, errors.New("unsupported jwk key type")
	}

	modBytes, err := base64.RawURLEncoding.DecodeString(j.Modulus)
	if err != nil {
		return nil, fmt.Errorf("invalid jwk modulus: %w", err)
	}
	expBytes, err := base64.RawURLEncoding.DecodeString(j.Expo)
	if err != nil {
		return nil, fmt.Errorf("invalid jwk exponent: %w", err)
	}

	modulus := new(big.Int).SetBytes(modBytes)
	exponent := new(big.Int).SetBytes(expBytes)
	if exponent.Sign() == 0 {
		return nil, errors.New("invalid jwk exponent")
	}

	return &rsa.PublicKey{
		N: modulus,
		E: int(exponent.Int64()),
	}, nil
}
