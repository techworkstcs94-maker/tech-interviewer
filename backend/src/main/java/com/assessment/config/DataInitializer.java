package com.assessment.config;

import com.assessment.model.Challenge;
import com.assessment.repository.ChallengeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Profile("local")
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final ChallengeRepository challengeRepository;

    @Override
    public void run(String... args) {
        if (challengeRepository.count() > 0) return;
        log.info("Seeding challenge data for local profile...");

        challengeRepository.saveAll(List.of(
            challenge(
                "REST Controller Basics", "EASY", "Spring MVC", 600,
                "Create a ProductController with two endpoints: GET /api/products (returns a list of all products) and GET /api/products/{id} (returns a single product or 404 if not found). The Product class should have fields: id (Long), name (String), price (Double), and category (String). Use proper Spring MVC annotations.",
                "@RestController\n@RequestMapping(\"/api/products\")\npublic class ProductController {\n    private List<Product> products = new ArrayList<>();\n\n    // TODO: Implement GET /api/products - return all products\n    // TODO: Implement GET /api/products/{id} - return product or 404\n}\n\nclass Product {\n    // TODO: Add fields: id (Long), name (String), price (Double), category (String)\n}",
                "[{\"id\":\"t1\",\"label\":\"@RestController annotation present\",\"weight\":20},{\"id\":\"t2\",\"label\":\"@GetMapping for list endpoint\",\"weight\":20},{\"id\":\"t3\",\"label\":\"@PathVariable for ID parameter\",\"weight\":20},{\"id\":\"t4\",\"label\":\"ResponseEntity used for 404\",\"weight\":20},{\"id\":\"t5\",\"label\":\"Product model with required fields\",\"weight\":20}]",
                "[{\"id\":\"h1\",\"text\":\"Use @RestController on your controller class\"},{\"id\":\"h2\",\"text\":\"Use @GetMapping for GET endpoints, @PathVariable for URL parameters\"},{\"id\":\"h3\",\"text\":\"Return ResponseEntity.notFound().build() when product is not found\"},{\"id\":\"h4\",\"text\":\"Initialize your products list with some sample data for testing\"}]",
                "[\"@RestController\",\"@GetMapping\",\"@PathVariable\",\"ResponseEntity\",\"Spring MVC\"]"
            ),
            challenge(
                "Service Layer Pattern", "MEDIUM", "Spring Core", 900,
                "Create a ProductService interface and a ProductServiceImpl class. The implementation should use constructor injection (no @Autowired on fields). Add @Service annotation. Validate that price > 0 and name is not blank — throw a custom exception (not RuntimeException) if validation fails.",
                "public interface ProductService {\n    // TODO: Define service methods\n}\n\n// TODO: Create ProductServiceImpl with @Service\n// TODO: Use constructor injection\n// TODO: Validate price > 0 and name not blank\n// TODO: Create a custom exception class",
                "[{\"id\":\"t1\",\"label\":\"@Service on implementation class\",\"weight\":17},{\"id\":\"t2\",\"label\":\"Implements service interface\",\"weight\":17},{\"id\":\"t3\",\"label\":\"Constructor injection (no @Autowired field)\",\"weight\":17},{\"id\":\"t4\",\"label\":\"Price > 0 validation\",\"weight\":17},{\"id\":\"t5\",\"label\":\"Non-blank name validation\",\"weight\":16},{\"id\":\"t6\",\"label\":\"Custom exception thrown\",\"weight\":16}]",
                "[{\"id\":\"h1\",\"text\":\"Use @Service on the implementation class, not the interface\"},{\"id\":\"h2\",\"text\":\"Declare dependencies as final fields and create a constructor\"},{\"id\":\"h3\",\"text\":\"Check price <= 0 or name.isBlank() and throw your custom exception\"},{\"id\":\"h4\",\"text\":\"Create a class like ProductValidationException that extends RuntimeException\"}]",
                "[\"@Service\",\"Constructor Injection\",\"Interface Pattern\",\"Input Validation\",\"Custom Exceptions\"]"
            ),
            challenge(
                "Spring Data JPA", "MEDIUM", "JPA", 900,
                "Create a Product @Entity with proper JPA annotations. Create a ProductRepository interface extending JpaRepository. Add a findByCategory(String category) derived query and a custom @Query method that filters products by maximum price. Include H2 or datasource configuration in application.properties.",
                "import jakarta.persistence.*;\nimport org.springframework.data.jpa.repository.*;\nimport org.springframework.data.repository.query.Param;\n\n// TODO: Create Product @Entity with @Id, @GeneratedValue\n// TODO: Create ProductRepository extending JpaRepository\n// TODO: Add findByCategory derived query\n// TODO: Add @Query for price filter\n\n// application.properties:\n// spring.datasource.url=jdbc:h2:mem:testdb\n// spring.datasource.driver-class-name=org.h2.Driver",
                "[{\"id\":\"t1\",\"label\":\"@Entity on Product class\",\"weight\":17},{\"id\":\"t2\",\"label\":\"@Id and @GeneratedValue present\",\"weight\":17},{\"id\":\"t3\",\"label\":\"Extends JpaRepository\",\"weight\":17},{\"id\":\"t4\",\"label\":\"findByCategory derived query\",\"weight\":17},{\"id\":\"t5\",\"label\":\"@Query for price filter\",\"weight\":16},{\"id\":\"t6\",\"label\":\"H2/datasource configured\",\"weight\":16}]",
                "[{\"id\":\"h1\",\"text\":\"Annotate the entity class with @Entity and @Table(name=\\\"products\\\")\"},{\"id\":\"h2\",\"text\":\"Use @Id and @GeneratedValue(strategy=GenerationType.IDENTITY) on the id field\"},{\"id\":\"h3\",\"text\":\"Spring Data derives the query automatically from findByCategory method name\"},{\"id\":\"h4\",\"text\":\"Use @Query(\\\"SELECT p FROM Product p WHERE p.price <= :maxPrice\\\") for custom queries\"}]",
                "[\"@Entity\",\"JpaRepository\",\"Derived Queries\",\"@Query\",\"JPQL\",\"H2 Database\"]"
            ),
            challenge(
                "Global Exception Handling", "MEDIUM", "Spring MVC", 720,
                "Create a @ControllerAdvice class that handles exceptions globally. Handle: ResourceNotFoundException → 404, MethodArgumentNotValidException → 400, and a generic Exception → 500. Each handler should return an ErrorResponse DTO containing timestamp, status, message, and path fields.",
                "import org.springframework.web.bind.annotation.*;\nimport org.springframework.http.*;\nimport org.springframework.web.context.request.WebRequest;\n\n// TODO: Create @ControllerAdvice class\n// TODO: Handle ResourceNotFoundException -> 404\n// TODO: Handle MethodArgumentNotValidException -> 400\n// TODO: Handle Exception -> 500\n// TODO: Create ErrorResponse DTO with timestamp, status, message, path",
                "[{\"id\":\"t1\",\"label\":\"@ControllerAdvice present\",\"weight\":20},{\"id\":\"t2\",\"label\":\"ResourceNotFoundException → 404\",\"weight\":20},{\"id\":\"t3\",\"label\":\"MethodArgumentNotValidException → 400\",\"weight\":20},{\"id\":\"t4\",\"label\":\"Generic Exception → 500\",\"weight\":20},{\"id\":\"t5\",\"label\":\"ErrorResponse DTO returned\",\"weight\":20}]",
                "[{\"id\":\"h1\",\"text\":\"Use @RestControllerAdvice (combines @ControllerAdvice + @ResponseBody)\"},{\"id\":\"h2\",\"text\":\"Each handler method gets @ExceptionHandler(SpecificException.class) and @ResponseStatus\"},{\"id\":\"h3\",\"text\":\"ErrorResponse should have: LocalDateTime timestamp, int status, String message, String path\"},{\"id\":\"h4\",\"text\":\"Use WebRequest.getDescription(false) to get the request path\"}]",
                "[\"@ControllerAdvice\",\"@ExceptionHandler\",\"@ResponseStatus\",\"ErrorResponse\",\"Global Exception Handling\"]"
            ),
            challenge(
                "WebClient & Circuit Breaker", "HARD", "Microservices", 1200,
                "Create an OrderService that uses WebClient to call GET /api/products/{id} on an external product-service. Add @CircuitBreaker annotation with a fallback method. Configure 2-second connect timeout and 5-second read timeout. Handle 4xx/5xx errors gracefully.",
                "import org.springframework.web.reactive.function.client.WebClient;\nimport io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;\nimport java.time.Duration;\n\n// TODO: Create OrderService with WebClient\n// TODO: Configure timeouts (2s connect, 5s read)\n// TODO: Add @CircuitBreaker with fallback method\n// TODO: Handle 4xx/5xx error responses\n\npublic class OrderService {\n    private final WebClient webClient;\n\n    // TODO: Implement getProduct(Long productId)\n    // TODO: Implement fallback method\n}",
                "[{\"id\":\"t1\",\"label\":\"WebClient configured\",\"weight\":17},{\"id\":\"t2\",\"label\":\"HTTP call implemented\",\"weight\":17},{\"id\":\"t3\",\"label\":\"@CircuitBreaker annotation\",\"weight\":17},{\"id\":\"t4\",\"label\":\"Fallback method present\",\"weight\":17},{\"id\":\"t5\",\"label\":\"Timeout configuration\",\"weight\":16},{\"id\":\"t6\",\"label\":\"Error handling for 4xx/5xx\",\"weight\":16}]",
                "[{\"id\":\"h1\",\"text\":\"Use WebClient.builder().baseUrl(...).build() and inject it as a bean\"},{\"id\":\"h2\",\"text\":\"Configure timeouts: HttpClient.create().option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 2000)\"},{\"id\":\"h3\",\"text\":\"Add @CircuitBreaker(name=\\\"productService\\\", fallbackMethod=\\\"getProductFallback\\\")\"},{\"id\":\"h4\",\"text\":\"Use .onStatus(HttpStatusCode::is4xxClientError, ...) for error handling\"}]",
                "[\"WebClient\",\"Circuit Breaker\",\"Resilience4j\",\"Timeout Configuration\",\"Reactive Programming\",\"Microservices\"]"
            ),
            challenge(
                "JWT Security Configuration", "HARD", "Security", 1500,
                "Configure Spring Security with JWT authentication. Create a SecurityFilterChain bean that disables CSRF, sets stateless session policy, permits /auth/** endpoints, and requires authentication for everything else. Create JwtUtil for token generation/validation and JwtAuthenticationFilter extending OncePerRequestFilter. Add POST /auth/login endpoint that returns a JWT token.",
                "import org.springframework.security.config.annotation.web.builders.HttpSecurity;\nimport org.springframework.security.config.http.SessionCreationPolicy;\nimport org.springframework.web.filter.OncePerRequestFilter;\nimport io.jsonwebtoken.*;\n\n// TODO: SecurityConfig with SecurityFilterChain @Bean\n//   - Disable CSRF\n//   - Stateless session (STATELESS)\n//   - Permit /auth/**\n//   - JwtAuthenticationFilter before UsernamePasswordAuthenticationFilter\n\n// TODO: JwtUtil - generate token with Jwts.builder(), validate token\n\n// TODO: JwtAuthenticationFilter extends OncePerRequestFilter\n//   - Extract Bearer token from Authorization header\n//   - Validate and set SecurityContext\n\n// TODO: POST /auth/login -> returns {token: \"...\"}",
                "[{\"id\":\"t1\",\"label\":\"SecurityFilterChain bean\",\"weight\":15},{\"id\":\"t2\",\"label\":\"CSRF disabled\",\"weight\":14},{\"id\":\"t3\",\"label\":\"/auth/** permitted\",\"weight\":14},{\"id\":\"t4\",\"label\":\"Stateless session policy\",\"weight\":14},{\"id\":\"t5\",\"label\":\"JwtAuthenticationFilter extends OncePerRequestFilter\",\"weight\":14},{\"id\":\"t6\",\"label\":\"JWT generation with claims\",\"weight\":15},{\"id\":\"t7\",\"label\":\"Login endpoint returns token\",\"weight\":14}]",
                "[{\"id\":\"h1\",\"text\":\"Use http.csrf(csrf -> csrf.disable()) and sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))\"},{\"id\":\"h2\",\"text\":\"Use Keys.hmacShaKeyFor(secret.getBytes()) for the signing key\"},{\"id\":\"h3\",\"text\":\"In the filter, extract token from Authorization header, validate with Jwts.parserBuilder()\"},{\"id\":\"h4\",\"text\":\"Set SecurityContextHolder.getContext().setAuthentication(auth) after validation\"}]",
                "[\"Spring Security\",\"JWT\",\"OncePerRequestFilter\",\"SecurityFilterChain\",\"CSRF\",\"Stateless Session\"]"
            )
        ));
        log.info("Seeded 6 challenges successfully.");
    }

    private Challenge challenge(String title, String difficulty, String category, int timeLimitSeconds,
                                String description, String starterCode, String testCasesJson,
                                String hintsJson, String conceptsJson) {
        Challenge c = new Challenge();
        c.setTitle(title);
        c.setDifficulty(difficulty);
        c.setCategory(category);
        c.setTimeLimitSeconds(timeLimitSeconds);
        c.setDescription(description);
        c.setStarterCode(starterCode);
        c.setTestCasesJson(testCasesJson);
        c.setHintsJson(hintsJson);
        c.setConceptsJson(conceptsJson);
        return c;
    }
}
