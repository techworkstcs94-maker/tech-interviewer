package com.solutions.challenge1;

import com.solutions.challenge1.model.Product;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Profile("challenge-1")
@RestController("c1ProductController")
@RequestMapping("/api/products")
class ProductController {

    private final List<Product> products = new ArrayList<>();
    private final AtomicLong ids = new AtomicLong(0);

    ProductController() {
        save(new Product(null, "Mechanical Keyboard", 89.99, "Peripherals"));
        save(new Product(null, "27\" Monitor", 199.50, "Displays"));
        save(new Product(null, "USB-C Hub", 34.00, "Accessories"));
    }

    private Product save(Product p) {
        p.setId(ids.incrementAndGet());
        products.add(p);
        return p;
    }

    @GetMapping
    public List<Product> getProducts() { return products; }

    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Long id) {
        return products.stream()
                .filter(p -> p.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    @PostMapping
    public ResponseEntity<Product> create(@RequestBody Product product) {
        return ResponseEntity.status(HttpStatus.CREATED).body(save(product));
    }
}
