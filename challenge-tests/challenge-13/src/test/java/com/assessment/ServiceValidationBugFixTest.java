package com.assessment;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
public class ServiceValidationBugFixTest {

    @Autowired
    private MockMvc mockMvc;

    // The core bug: valid input is currently rejected. A positive price + non-blank name
    // must be accepted (2xx), not turned into a 400.
    @Test
    public void validProduct_isAccepted() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Widget\",\"price\":10.0}"))
                .andReturn();
        int status = result.getResponse().getStatus();
        assertTrue(status >= 200 && status < 300,
                "A valid product should be accepted (2xx), got: " + status);
    }

    @Test
    public void nonPositivePrice_isRejected() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Widget\",\"price\":-5.0}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void zeroPrice_isRejected() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Widget\",\"price\":0.0}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void blankName_isRejected() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"price\":10.0}"))
                .andExpect(status().isBadRequest());
    }
}
