package com.solutions.challenge5;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Profile("challenge-5")
@RestController
class ExternalProductController {

    private final ProductClient client;

    ExternalProductController(ProductClient client) { this.client = client; }

    @GetMapping("/api/external/products")
    public List<Map<String, Object>> products() { return client.getProducts(); }
}
