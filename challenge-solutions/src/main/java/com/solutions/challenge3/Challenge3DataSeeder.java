package com.solutions.challenge3;

import com.solutions.challenge3.model.Product;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Profile("challenge-3")
@Component
class Challenge3DataSeeder implements CommandLineRunner {

    private final ProductRepository repo;

    Challenge3DataSeeder(ProductRepository repo) { this.repo = repo; }

    @Override
    public void run(String... args) {
        repo.save(new Product("Mechanical Keyboard", 89.99, "Peripherals"));
        repo.save(new Product("USB-C Hub", 34.00, "Peripherals"));
        repo.save(new Product("27\" Monitor", 199.50, "Displays"));
    }
}
