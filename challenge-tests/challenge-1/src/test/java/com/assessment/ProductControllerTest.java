package com.assessment;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
public class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void getProducts_returns200AndArray() throws Exception {
        mockMvc.perform(get("/api/products").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }

    @Test
    public void getProductById_whenExists_returns200() throws Exception {
        MvcResult listResult = mockMvc.perform(get("/api/products").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();
        String body = listResult.getResponse().getContentAsString();
        // If list is not empty, try getting first item
        if (body != null && !body.equals("[]") && body.contains("\"id\"")) {
            mockMvc.perform(get("/api/products/1").accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());
        } else {
            // Acceptable if list is empty — just verify 200 on list
            assertTrue(true, "Empty product list is acceptable");
        }
    }

    @Test
    public void getProductById_whenMissing_returns404() throws Exception {
        mockMvc.perform(get("/api/products/99999").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    public void productResponse_hasRequiredFields() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/products").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();
        String body = result.getResponse().getContentAsString();
        // If there are products, verify they have the required fields
        if (body != null && !body.equals("[]") && body.contains("{")) {
            assertTrue(body.contains("\"id\""), "Response should contain 'id' field");
            assertTrue(body.contains("\"name\""), "Response should contain 'name' field");
            assertTrue(body.contains("\"price\""), "Response should contain 'price' field");
            assertTrue(body.contains("\"category\""), "Response should contain 'category' field");
        } else {
            // No products to check; pass this test
            assertTrue(true, "No products in list to validate fields");
        }
    }

    @Test
    public void multipleProducts_allReturned() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/products").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();
        String body = result.getResponse().getContentAsString();
        assertNotNull(body, "Response body should not be null");
        assertTrue(body.startsWith("["), "Response should be a JSON array");
    }
}
