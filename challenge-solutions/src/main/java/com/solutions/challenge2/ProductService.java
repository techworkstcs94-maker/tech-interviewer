package com.solutions.challenge2;

import com.solutions.challenge2.model.Product;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Profile("challenge-2")
@Service("c2ProductService")
class ProductService {

    private final List<Product> store = new ArrayList<>();
    private final AtomicLong ids = new AtomicLong(0);

    Product create(Product product) {
        product.setId(ids.incrementAndGet());
        store.add(product);
        return product;
    }

    List<Product> findAll() { return store; }
}
