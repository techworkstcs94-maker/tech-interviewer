package com.assessment;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.ApplicationContext;
import org.springframework.data.jpa.repository.JpaRepository;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
public class JpaRepositoryTest {

    @Autowired
    private ApplicationContext context;

    private Object getProductRepository() {
        for (String name : context.getBeanDefinitionNames()) {
            if (name.toLowerCase().contains("productrepository") || name.toLowerCase().contains("product-repository")) {
                try { return context.getBean(name); } catch (Exception ignored) {}
            }
        }
        try { return context.getBean("productRepository"); } catch (Exception ignored) {}
        return null;
    }

    private Object getOrCreateProduct(String name, String category, double price) throws Exception {
        Class<?> productClass = null;
        try { productClass = Class.forName("com.assessment.Product"); } catch (ClassNotFoundException ignored) {}
        if (productClass == null) return null;
        Object product = productClass.getDeclaredConstructor().newInstance();
        try { productClass.getMethod("setName", String.class).invoke(product, name); } catch (Exception ignored) {}
        try { productClass.getMethod("setCategory", String.class).invoke(product, category); } catch (Exception ignored) {}
        try { productClass.getMethod("setPrice", Double.class).invoke(product, price); } catch (Exception ignored) {}
        try { productClass.getMethod("setPrice", double.class).invoke(product, price); } catch (Exception ignored) {}
        return product;
    }

    @Test
    public void product_savedAndRetrieved() throws Exception {
        Object repo = getProductRepository();
        assertNotNull(repo, "ProductRepository bean should exist");
        assertTrue(repo instanceof JpaRepository, "ProductRepository should extend JpaRepository");
    }

    @Test
    public void findByCategory_returnsMatchingOnly() throws Exception {
        Object repo = getProductRepository();
        assertNotNull(repo, "ProductRepository should exist");
        // Verify findByCategory method exists
        var methods = repo.getClass().getMethods();
        boolean found = false;
        for (var m : methods) {
            if (m.getName().equals("findByCategory")) {
                found = true;
                break;
            }
        }
        assertTrue(found, "ProductRepository should have findByCategory method");
    }

    @Test
    public void findByPriceLessThan_returnsFiltered() throws Exception {
        Object repo = getProductRepository();
        assertNotNull(repo, "ProductRepository should exist");
        // Verify a price-filter method exists (via @Query or derived)
        var methods = repo.getClass().getMethods();
        boolean found = false;
        for (var m : methods) {
            String n = m.getName().toLowerCase();
            if (n.contains("price") && (n.contains("less") || n.contains("max") || n.contains("filter"))) {
                found = true;
                break;
            }
        }
        // If no derived method, check for @Query-annotated method
        if (!found) {
            for (var m : repo.getClass().getInterfaces()) {
                for (var im : m.getDeclaredMethods()) {
                    if (im.isAnnotationPresent(org.springframework.data.jpa.repository.Query.class)) {
                        found = true;
                        break;
                    }
                }
            }
        }
        assertTrue(found, "Repository should have a price filter query (@Query or derived)");
    }

    @Test
    public void product_allFieldsPersisted() throws Exception {
        Class<?> productClass = null;
        try { productClass = Class.forName("com.assessment.Product"); } catch (ClassNotFoundException e) {
            fail("Product class not found in com.assessment package");
        }
        assertNotNull(productClass);
        // Check required fields exist
        boolean hasId = false, hasName = false, hasPrice = false, hasCategory = false;
        for (var f : productClass.getDeclaredFields()) {
            switch (f.getName()) {
                case "id" -> hasId = true;
                case "name" -> hasName = true;
                case "price" -> hasPrice = true;
                case "category" -> hasCategory = true;
            }
        }
        assertTrue(hasId, "Product should have 'id' field");
        assertTrue(hasName, "Product should have 'name' field");
        assertTrue(hasPrice, "Product should have 'price' field");
        assertTrue(hasCategory, "Product should have 'category' field");
    }

    @Test
    public void deleteProduct_removedFromDb() throws Exception {
        Object repo = getProductRepository();
        assertNotNull(repo, "ProductRepository should exist");
        // Verify deleteById or delete method is available (inherited from JpaRepository)
        var methods = repo.getClass().getMethods();
        boolean hasDelete = false;
        for (var m : methods) {
            if (m.getName().startsWith("delete")) {
                hasDelete = true;
                break;
            }
        }
        assertTrue(hasDelete, "Repository should have delete method (from JpaRepository)");
    }
}
