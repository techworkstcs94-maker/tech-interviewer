package com.solutions.challenge6;

import com.solutions.challenge6.model.Product;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Profile("challenge-6")
@RestController("c6ProductController")
@RequestMapping("/api/products")
class ProductController {

    @GetMapping
    List<Product> all() {
        return List.of(
                new Product(1L, "Mechanical Keyboard", 89.99, "Peripherals"),
                new Product(2L, "27\" Monitor", 199.50, "Displays"));
    }
}
