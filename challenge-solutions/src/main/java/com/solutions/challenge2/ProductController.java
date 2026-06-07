package com.solutions.challenge2;

import com.solutions.challenge2.model.Product;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Profile("challenge-2")
@RestController("c2ProductController")
@RequestMapping("/api/products")
class ProductController {

    private final ProductService productService;

    ProductController(ProductService productService) { this.productService = productService; }

    @GetMapping
    public List<Product> all() { return productService.findAll(); }

    @PostMapping
    public ResponseEntity<Product> create(@Valid @RequestBody Product product) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(product));
    }
}
