package com.solutions;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

// Exclude only the auto-generated random-password bean; security itself is
// wired manually below (OpenSecurityConfig for challenges 1-5, SecurityConfig
// in the challenge6 package for challenge-6).
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}

// Active for every profile EXCEPT challenge-6.
// Allows all requests so challenges 1-5 need no authentication.
@Configuration
@EnableWebSecurity
@Profile("!challenge-6")
class OpenSecurityConfig {

    @Bean
    SecurityFilterChain permitAll(HttpSecurity http) throws Exception {
        http.csrf(c -> c.disable())
                .authorizeHttpRequests(a -> a.anyRequest().permitAll());
        return http.build();
    }
}

@RestController
class HomeController {
    @GetMapping("/")
    String home() {
        return """
                ╔══════════════════════════════════════════════════════════════╗
                  Challenge Solutions — select a profile to activate one:
                  mvn spring-boot:run -Dspring-boot.run.profiles=<profile>
                ╚══════════════════════════════════════════════════════════════╝

                challenge-1  (REST Controller Basics)
                  GET  /api/products
                  GET  /api/products/{id}
                  POST /api/products   body: {"name":"X","price":9.9,"category":"Y"}

                challenge-2  (Service Layer + Bean Validation)
                  GET  /api/products
                  POST /api/products   body: {"name":"X","price":9.9,"category":"Y"}
                  (blank name or price <= 0 → 400)

                challenge-3  (Spring Data JPA Repository)
                  GET  /ch3/products
                  POST /ch3/products              body: {"name":"X","price":9.9,"category":"Y"}
                  GET  /ch3/products/by-category  ?category=Peripherals
                  GET  /ch3/products/by-max-price ?maxPrice=100
                  GET  /h2-console  (JDBC URL: jdbc:h2:mem:solutionsdb)

                challenge-4  (Global Exception Handling)
                  GET  /api/products/{id}  → always 404 + ErrorResponse JSON
                  POST /api/products       → @Valid body; invalid → 400 + errors[]
                  GET  /api/boom           → always 500 + ErrorResponse JSON

                challenge-5  (Circuit Breaker + Fallback + Timeout)
                  GET  /api/external/products
                  (upstream at localhost:9999 not running → fallback response)

                challenge-6  (Stateless JWT Security)
                  POST /auth/login   body: {"username":"user","password":"password"}
                  GET  /api/products Authorization: Bearer <token>
                """;
    }
}
