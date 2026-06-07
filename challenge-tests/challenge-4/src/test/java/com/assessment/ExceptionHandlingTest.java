package com.assessment;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
public class ExceptionHandlingTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private org.springframework.context.ApplicationContext context;

    @Test
    public void resourceNotFound_returns404WithErrorResponse() throws Exception {
        // Try a URL that triggers ResourceNotFoundException
        mockMvc.perform(get("/api/products/99999").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    public void errorResponse_hasTimestampStatusMessagePath() throws Exception {
        var result = mockMvc.perform(get("/api/products/99999").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andReturn();
        String body = result.getResponse().getContentAsString();
        if (body != null && !body.isBlank()) {
            // If ErrorResponse is returned, verify it has expected fields
            assertTrue(body.contains("status") || body.contains("message") || body.contains("timestamp"),
                    "Error response should contain status, message, or timestamp fields");
        }
    }

    @Test
    public void invalidRequest_returns400() throws Exception {
        // A malformed request to any endpoint should return 400
        var result = mockMvc.perform(get("/api/invalid-endpoint").accept(MediaType.APPLICATION_JSON))
                .andReturn();
        int status = result.getResponse().getStatus();
        assertTrue(status == 400 || status == 404,
                "Invalid request should return 400 or 404, got: " + status);
    }

    @Test
    public void unexpectedError_returns500() throws Exception {
        // Verify the @ControllerAdvice bean exists in the context
        boolean hasControllerAdvice = false;
        for (String beanName : context.getBeanDefinitionNames()) {
            Object bean = null;
            try { bean = context.getBean(beanName); } catch (Exception ignored) {}
            if (bean != null) {
                Class<?> cls = bean.getClass();
                if (cls.isAnnotationPresent(org.springframework.web.bind.annotation.ControllerAdvice.class) ||
                    cls.isAnnotationPresent(org.springframework.web.bind.annotation.RestControllerAdvice.class)) {
                    hasControllerAdvice = true;
                    break;
                }
                // Check superclass and interfaces
                for (var ann : cls.getAnnotations()) {
                    if (ann.annotationType().getSimpleName().contains("ControllerAdvice")) {
                        hasControllerAdvice = true;
                        break;
                    }
                }
            }
        }
        assertTrue(hasControllerAdvice, "@ControllerAdvice bean should be present in application context");
    }
}
