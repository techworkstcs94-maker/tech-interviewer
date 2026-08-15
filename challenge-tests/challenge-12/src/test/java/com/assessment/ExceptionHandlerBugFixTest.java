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
public class ExceptionHandlerBugFixTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void existingItem_returns200() throws Exception {
        mockMvc.perform(get("/api/items/5").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    // The core bug: a missing item raises ResourceNotFoundException, which the advice
    // wrongly maps to 500. It must map to 404.
    @Test
    public void missingItem_returns404() throws Exception {
        mockMvc.perform(get("/api/items/999").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    public void missingItem_bodyCarriesMessage() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/items/999").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andReturn();
        String body = result.getResponse().getContentAsString();
        assertNotNull(body, "Error body should not be null");
        assertTrue(body.toLowerCase().contains("not found") || body.contains("999"),
                "Error body should carry the exception message; got: " + body);
    }
}
