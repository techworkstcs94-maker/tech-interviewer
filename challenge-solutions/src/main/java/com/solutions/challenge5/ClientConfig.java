package com.solutions.challenge5;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Profile("challenge-5")
@Configuration
class ClientConfig {

    @Bean
    RestTemplate restTemplate(RestTemplateBuilder builder,
                              @Value("${upstream.timeout-ms:1000}") long timeoutMs) {
        return builder
                .setConnectTimeout(Duration.ofMillis(timeoutMs))
                .setReadTimeout(Duration.ofMillis(timeoutMs))
                .build();
    }
}
