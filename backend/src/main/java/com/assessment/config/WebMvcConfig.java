package com.assessment.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location)
                            throws IOException {
                        Resource requested = location.createRelative(resourcePath);
                        // Serve the actual file if it exists (JS, CSS, images, etc.)
                        if (requested.exists() && requested.isReadable()) {
                            return requested;
                        }
                        // SPA fallback — API routes are handled by @RestController
                        // beans before this resolver is ever reached, so returning
                        // index.html here only affects unknown browser navigation paths.
                        return new ClassPathResource("/static/index.html");
                    }
                });
    }
}
