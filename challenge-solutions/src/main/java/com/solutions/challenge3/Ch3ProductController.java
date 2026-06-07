package com.solutions.challenge3;

import com.solutions.challenge3.model.Product;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Profile("challenge-3")
@RestController
@RequestMapping("/ch3/products")
class Ch3ProductController {

    private final ProductRepository repo;

    Ch3ProductController(ProductRepository repo) { this.repo = repo; }

    @GetMapping
    List<Product> all() { return repo.findAll(); }

    @PostMapping
    ResponseEntity<Product> create(@RequestBody Product product) {
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(product));
    }

    @GetMapping("/by-category")
    List<Product> byCategory(@RequestParam String category) { return repo.findByCategory(category); }

    @GetMapping("/by-max-price")
    List<Product> byMaxPrice(@RequestParam Double maxPrice) { return repo.findByPriceLessThan(maxPrice); }
}
