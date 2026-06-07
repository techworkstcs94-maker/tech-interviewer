package com.solutions.challenge3;

import com.solutions.challenge3.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByCategory(String category);

    List<Product> findByPriceLessThan(Double price);
}
