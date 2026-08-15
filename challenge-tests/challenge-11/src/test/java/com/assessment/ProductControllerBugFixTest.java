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
public class ProductControllerBugFixTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void listEndpoint_returns200AndArray() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/products").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();
        String body = result.getResponse().getContentAsString();
        assertNotNull(body, "List response body should not be null");
        assertTrue(body.trim().startsWith("["), "List endpoint should return a JSON array");
    }

    @Test
    public void existingProduct_returns200() throws Exception {
        mockMvc.perform(get("/api/products/1").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    public void existingProduct_bodyContainsFields() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/products/1").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();
        String body = result.getResponse().getContentAsString();
        assertTrue(body.contains("\"id\""), "Product body should contain 'id'");
        assertTrue(body.contains("\"name\""), "Product body should contain 'name'");
    }

    // The core bug: a missing product must yield 404, not 200 with an empty body.
    @Test
    public void missingProduct_returns404() throws Exception {
        mockMvc.perform(get("/api/products/99999").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}
