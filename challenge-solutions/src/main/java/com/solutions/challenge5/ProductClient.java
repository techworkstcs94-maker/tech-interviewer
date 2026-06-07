package com.solutions.challenge5;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Profile("challenge-5")
@Service
class ProductClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    ProductClient(RestTemplate restTemplate, @Value("${upstream.base-url}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    @CircuitBreaker(name = "productService", fallbackMethod = "fallback")
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getProducts() {
        return restTemplate.getForObject(baseUrl + "/products", List.class);
    }

    @SuppressWarnings("unused")
    List<Map<String, Object>> fallback(Throwable t) {
        return List.of(Map.of(
                "name", "FALLBACK",
                "source", "fallback",
                "reason", t.getClass().getSimpleName()));
    }
}
