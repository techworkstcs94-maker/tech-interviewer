CREATE TABLE challenges (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    time_limit_seconds INTEGER NOT NULL,
    starter_code TEXT,
    test_cases_json TEXT,
    hints_json TEXT,
    concepts_json TEXT
);

INSERT INTO challenges (title, description, difficulty, category, time_limit_seconds, starter_code, test_cases_json, hints_json, concepts_json) VALUES
(
    'REST Controller Basics',
    'Create a ProductController with two endpoints: GET /api/products (returns a list of all products) and GET /api/products/{id} (returns a single product or 404 if not found). The Product class should have fields: id (Long), name (String), price (Double), and category (String). Use proper Spring MVC annotations.',
    'EASY',
    'Spring MVC',
    600,
    '@RestController' || chr(10) || '@RequestMapping("/api/products")' || chr(10) || 'public class ProductController {' || chr(10) || '    private List<Product> products = new ArrayList<>();' || chr(10) || chr(10) || '    // TODO: Implement GET /api/products - return all products' || chr(10) || '    // TODO: Implement GET /api/products/{id} - return product or 404' || chr(10) || '}' || chr(10) || chr(10) || 'class Product {' || chr(10) || '    // TODO: Add fields: id (Long), name (String), price (Double), category (String)' || chr(10) || '}',
    '[{"id":"t1","label":"@RestController annotation present","weight":20},{"id":"t2","label":"@GetMapping for list endpoint","weight":20},{"id":"t3","label":"@PathVariable for ID parameter","weight":20},{"id":"t4","label":"ResponseEntity used for 404","weight":20},{"id":"t5","label":"Product model with required fields","weight":20}]',
    '[{"id":"h1","text":"Use @RestController on your controller class"},{"id":"h2","text":"Use @GetMapping for GET endpoints, @PathVariable for URL parameters"},{"id":"h3","text":"Return ResponseEntity.notFound().build() when product is not found"},{"id":"h4","text":"Initialize your products list with some sample data for testing"}]',
    '["@RestController","@GetMapping","@PathVariable","ResponseEntity","Spring MVC"]'
),
(
    'Service Layer Pattern',
    'Create a ProductService interface and a ProductServiceImpl class. The implementation should use constructor injection (no @Autowired on fields). Add @Service annotation. Validate that price > 0 and name is not blank — throw a custom exception (not RuntimeException) if validation fails.',
    'MEDIUM',
    'Spring Core',
    900,
    'public interface ProductService {' || chr(10) || '    // TODO: Define service methods' || chr(10) || '}' || chr(10) || chr(10) || '// TODO: Create ProductServiceImpl with @Service' || chr(10) || '// TODO: Use constructor injection' || chr(10) || '// TODO: Validate price > 0 and name not blank' || chr(10) || '// TODO: Create a custom exception class',
    '[{"id":"t1","label":"@Service on implementation class","weight":17},{"id":"t2","label":"Implements service interface","weight":17},{"id":"t3","label":"Constructor injection (no @Autowired field)","weight":17},{"id":"t4","label":"Price > 0 validation","weight":17},{"id":"t5","label":"Non-blank name validation","weight":16},{"id":"t6","label":"Custom exception thrown","weight":16}]',
    '[{"id":"h1","text":"Use @Service on the implementation class, not the interface"},{"id":"h2","text":"Declare dependencies as final fields and create a constructor (or use @RequiredArgsConstructor from Lombok)"},{"id":"h3","text":"Check price <= 0 or name.isBlank() and throw your custom exception"},{"id":"h4","text":"Create a class like ProductValidationException that extends RuntimeException"}]',
    '["@Service","Constructor Injection","Interface Pattern","Input Validation","Custom Exceptions"]'
),
(
    'Spring Data JPA',
    'Create a Product @Entity with proper JPA annotations. Create a ProductRepository interface extending JpaRepository. Add a findByCategory(String category) derived query and a custom @Query method that filters products by maximum price. Include H2 or datasource configuration in application.properties.',
    'MEDIUM',
    'JPA',
    900,
    'import jakarta.persistence.*;' || chr(10) || 'import org.springframework.data.jpa.repository.*;' || chr(10) || 'import org.springframework.data.repository.query.Param;' || chr(10) || chr(10) || '// TODO: Create Product @Entity with @Id, @GeneratedValue' || chr(10) || '// TODO: Create ProductRepository extending JpaRepository' || chr(10) || '// TODO: Add findByCategory derived query' || chr(10) || '// TODO: Add @Query for price filter' || chr(10) || chr(10) || '// application.properties:' || chr(10) || '// spring.datasource.url=jdbc:h2:mem:testdb' || chr(10) || '// spring.datasource.driver-class-name=org.h2.Driver',
    '[{"id":"t1","label":"@Entity on Product class","weight":17},{"id":"t2","label":"@Id and @GeneratedValue present","weight":17},{"id":"t3","label":"Extends JpaRepository","weight":17},{"id":"t4","label":"findByCategory derived query","weight":17},{"id":"t5","label":"@Query for price filter","weight":16},{"id":"t6","label":"H2/datasource configured","weight":16}]',
    '[{"id":"h1","text":"Annotate the entity class with @Entity and @Table(name=\"products\")"},{"id":"h2","text":"Use @Id and @GeneratedValue(strategy=GenerationType.IDENTITY) on the id field"},{"id":"h3","text":"Spring Data derives the query automatically from findByCategory method name"},{"id":"h4","text":"Use @Query(\"SELECT p FROM Product p WHERE p.price <= :maxPrice\") for custom queries"}]',
    '["@Entity","JpaRepository","Derived Queries","@Query","JPQL","H2 Database"]'
),
(
    'Global Exception Handling',
    'Create a @ControllerAdvice class that handles exceptions globally. Handle: ResourceNotFoundException → 404, MethodArgumentNotValidException → 400, and a generic Exception → 500. Each handler should return an ErrorResponse DTO containing timestamp, status, message, and path fields.',
    'MEDIUM',
    'Spring MVC',
    720,
    'import org.springframework.web.bind.annotation.*;' || chr(10) || 'import org.springframework.http.*;' || chr(10) || 'import org.springframework.web.context.request.WebRequest;' || chr(10) || chr(10) || '// TODO: Create @ControllerAdvice class' || chr(10) || '// TODO: Handle ResourceNotFoundException -> 404' || chr(10) || '// TODO: Handle MethodArgumentNotValidException -> 400' || chr(10) || '// TODO: Handle Exception -> 500' || chr(10) || '// TODO: Create ErrorResponse DTO with timestamp, status, message, path',
    '[{"id":"t1","label":"@ControllerAdvice present","weight":20},{"id":"t2","label":"ResourceNotFoundException → 404","weight":20},{"id":"t3","label":"MethodArgumentNotValidException → 400","weight":20},{"id":"t4","label":"Generic Exception → 500","weight":20},{"id":"t5","label":"ErrorResponse DTO returned","weight":20}]',
    '[{"id":"h1","text":"Use @RestControllerAdvice (combines @ControllerAdvice + @ResponseBody)"},{"id":"h2","text":"Each handler method gets @ExceptionHandler(SpecificException.class) and @ResponseStatus"},{"id":"h3","text":"ErrorResponse should have: LocalDateTime timestamp, int status, String message, String path"},{"id":"h4","text":"Use WebRequest.getDescription(false) to get the request path"}]',
    '["@ControllerAdvice","@ExceptionHandler","@ResponseStatus","ErrorResponse","Global Exception Handling"]'
),
(
    'WebClient & Circuit Breaker',
    'Create an OrderService that uses WebClient to call GET /api/products/{id} on an external product-service. Add @CircuitBreaker annotation with a fallback method. Configure 2-second connect timeout and 5-second read timeout. Handle 4xx/5xx errors gracefully.',
    'HARD',
    'Microservices',
    1200,
    'import org.springframework.web.reactive.function.client.WebClient;' || chr(10) || 'import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;' || chr(10) || 'import java.time.Duration;' || chr(10) || chr(10) || '// TODO: Create OrderService with WebClient' || chr(10) || '// TODO: Configure timeouts (2s connect, 5s read)' || chr(10) || '// TODO: Add @CircuitBreaker with fallback method' || chr(10) || '// TODO: Handle 4xx/5xx error responses' || chr(10) || chr(10) || 'public class OrderService {' || chr(10) || '    private final WebClient webClient;' || chr(10) || chr(10) || '    // TODO: Implement getProduct(Long productId)' || chr(10) || '    // TODO: Implement fallback method' || chr(10) || '}',
    '[{"id":"t1","label":"WebClient configured","weight":17},{"id":"t2","label":"HTTP call implemented","weight":17},{"id":"t3","label":"@CircuitBreaker annotation","weight":17},{"id":"t4","label":"Fallback method present","weight":17},{"id":"t5","label":"Timeout configuration","weight":16},{"id":"t6","label":"Error handling for 4xx/5xx","weight":16}]',
    '[{"id":"h1","text":"Use WebClient.builder().baseUrl(...).build() and inject it as a bean"},{"id":"h2","text":"Configure timeouts: HttpClient.create().option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 2000)"},{"id":"h3","text":"Add @CircuitBreaker(name=\"productService\", fallbackMethod=\"getProductFallback\")"},{"id":"h4","text":"Use .onStatus(HttpStatusCode::is4xxClientError, ...) for error handling"}]',
    '["WebClient","Circuit Breaker","Resilience4j","Timeout Configuration","Reactive Programming","Microservices"]'
),
(
    'JWT Security Configuration',
    'Configure Spring Security with JWT authentication. Create a SecurityFilterChain bean that disables CSRF, sets stateless session policy, permits /auth/** endpoints, and requires authentication for everything else. Create JwtUtil for token generation/validation and JwtAuthenticationFilter extending OncePerRequestFilter. Add POST /auth/login endpoint that returns a JWT token.',
    'HARD',
    'Security',
    1500,
    'import org.springframework.security.config.annotation.web.builders.HttpSecurity;' || chr(10) || 'import org.springframework.security.config.http.SessionCreationPolicy;' || chr(10) || 'import org.springframework.web.filter.OncePerRequestFilter;' || chr(10) || 'import io.jsonwebtoken.*;' || chr(10) || chr(10) || '// TODO: SecurityConfig with SecurityFilterChain @Bean' || chr(10) || '//   - Disable CSRF' || chr(10) || '//   - Stateless session (STATELESS)' || chr(10) || '//   - Permit /auth/**' || chr(10) || '//   - JwtAuthenticationFilter before UsernamePasswordAuthenticationFilter' || chr(10) || chr(10) || '// TODO: JwtUtil - generate token with Jwts.builder(), validate token' || chr(10) || chr(10) || '// TODO: JwtAuthenticationFilter extends OncePerRequestFilter' || chr(10) || '//   - Extract Bearer token from Authorization header' || chr(10) || '//   - Validate and set SecurityContext' || chr(10) || chr(10) || '// TODO: POST /auth/login -> returns {token: "..."}',
    '[{"id":"t1","label":"SecurityFilterChain bean","weight":15},{"id":"t2","label":"CSRF disabled","weight":14},{"id":"t3","label":"/auth/** permitted","weight":14},{"id":"t4","label":"Stateless session policy","weight":14},{"id":"t5","label":"JwtAuthenticationFilter extends OncePerRequestFilter","weight":14},{"id":"t6","label":"JWT generation with claims","weight":15},{"id":"t7","label":"Login endpoint returns token","weight":14}]',
    '[{"id":"h1","text":"Use http.csrf(csrf -> csrf.disable()) and sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))"},{"id":"h2","text":"Use Keys.hmacShaKeyFor(secret.getBytes()) for the signing key"},{"id":"h3","text":"In the filter, extract token from Authorization header, validate with Jwts.parserBuilder()"},{"id":"h4","text":"Set SecurityContextHolder.getContext().setAuthentication(auth) after validation"}]',
    '["Spring Security","JWT","OncePerRequestFilter","SecurityFilterChain","CSRF","Stateless Session"]'
);
