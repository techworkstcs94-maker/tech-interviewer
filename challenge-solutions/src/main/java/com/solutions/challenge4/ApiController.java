package com.solutions.challenge4;

import com.solutions.challenge4.model.Product;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

@Profile("challenge-4")
@RestController("c4ApiController")
@RequestMapping("/api")
class ApiController {

    @GetMapping("/products/{id}")
    Product getProduct(@PathVariable Long id) {
        throw new ResourceNotFoundException("Product " + id + " not found");
    }

    @PostMapping("/products")
    Product create(@Valid @RequestBody Product product) { return product; }

    @GetMapping("/boom")
    String boom() { throw new IllegalStateException("unexpected server failure"); }
}
