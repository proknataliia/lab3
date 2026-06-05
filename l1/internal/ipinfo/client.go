package ipinfo

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Client struct {
	apiKey string
	client *http.Client
}

func NewClient(apiKey string) *Client {
	return &Client{
		apiKey: apiKey,
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *Client) GetInfo(ip string) (*Response, error) {
	req, err := http.NewRequest("GET", fmt.Sprintf("https://ipinfo.io/%s/json", ip), nil)
	if err != nil {
		return nil, err
	}

	if c.apiKey != "" {
		q := req.URL.Query()
		q.Set("token", c.apiKey)
		req.URL.RawQuery = q.Encode()
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ipinfo api returned status %d", resp.StatusCode)
	}

	var result Response
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	result.Query = ip
	return &result, nil
}
