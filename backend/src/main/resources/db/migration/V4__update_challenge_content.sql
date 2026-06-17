UPDATE challenges SET
    description = 'Build a RESTful ProductController with two endpoints.

▸ GET /api/products — return all products (200 OK)
▸ GET /api/products/{id} — return single product (200 OK) or 404 if not found

Product fields: id (Long), name (String), price (Double), category (String)

Use @RestController, @RequestMapping("/api/products"), @GetMapping, @PathVariable, and ResponseEntity.',
    starter_code = '@RestController
@RequestMapping("/api/products")
public class ProductController {
    private List<Product> products = new ArrayList<>();

    // TODO: Implement GET /api/products - return all products
    // TODO: Implement GET /api/products/{id} - return product or 404
}

class Product {
    // TODO: Add fields: id (Long), name (String), price (Double), category (String)
}',
    test_cases_json = '[{"id":"t1","label":"@RestController annotation present","weight":20},{"id":"t2","label":"@GetMapping for list endpoint","weight":20},{"id":"t3","label":"@PathVariable for ID parameter","weight":20},{"id":"t4","label":"404 handling present","weight":20},{"id":"t5","label":"Product model with required fields","weight":20}]',
    hints_json = '[{"id":"h1","text":"Use @RestController on your controller class"},{"id":"h2","text":"Use @GetMapping for GET endpoints, @PathVariable for URL parameters"},{"id":"h3","text":"Return ResponseEntity.notFound().build() when product is not found"},{"id":"h4","text":"Initialize your products list with some sample data for testing"}]'
WHERE title = 'REST Controller Basics';

UPDATE challenges SET
    description = 'Implement the Service Layer Pattern with interface + implementation.

▸ Define a ProductService interface with your service methods
▸ Create ProductServiceImpl with @Service annotation
▸ Use constructor injection — declare fields as final, no @Autowired on fields
▸ Validate: price must be > 0; name must not be blank
▸ Throw a custom exception class (not RuntimeException directly) when validation fails',
    starter_code = 'public interface ProductService {
    // TODO: Define service methods
}

// TODO: Create ProductServiceImpl with @Service
// TODO: Use constructor injection
// TODO: Validate price > 0 and name not blank
// TODO: Create a custom exception class',
    hints_json = '[{"id":"h1","text":"Use @Service on the implementation class, not the interface"},{"id":"h2","text":"Declare dependencies as final fields and create a constructor"},{"id":"h3","text":"Check price <= 0 or name.isBlank() and throw your custom exception"},{"id":"h4","text":"Create a class like ProductValidationException that extends RuntimeException"}]'
WHERE title = 'Service Layer Pattern';

UPDATE challenges SET
    description = 'Set up JPA persistence for Product using Spring Data JPA.

▸ Annotate Product with @Entity, @Id, @GeneratedValue
▸ Create ProductRepository extending JpaRepository<Product, Long>
▸ Add derived query: findByCategory(String category)
▸ Add @Query method to filter products by a maximum price using JPQL
▸ Configure H2 in-memory datasource in application.properties',
    starter_code = 'import jakarta.persistence.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

// TODO: Create Product @Entity with @Id, @GeneratedValue
// TODO: Create ProductRepository extending JpaRepository
// TODO: Add findByCategory derived query
// TODO: Add @Query for price filter

// application.properties:
// spring.datasource.url=jdbc:h2:mem:testdb
// spring.datasource.driver-class-name=org.h2.Driver',
    hints_json = '[{"id":"h1","text":"Annotate the entity class with @Entity and @Table(name=\"products\")"},{"id":"h2","text":"Use @Id and @GeneratedValue(strategy=GenerationType.IDENTITY) on the id field"},{"id":"h3","text":"Spring Data derives the query automatically from findByCategory method name"},{"id":"h4","text":"Use @Query(\"SELECT p FROM Product p WHERE p.price <= :maxPrice\") for custom queries"}]'
WHERE title = 'Spring Data JPA';

UPDATE challenges SET
    description = 'Build a global exception handler using @ControllerAdvice.

▸ Handle ResourceNotFoundException → HTTP 404
▸ Handle MethodArgumentNotValidException → HTTP 400
▸ Handle generic Exception → HTTP 500

Each handler must return an ErrorResponse DTO with:
  timestamp (LocalDateTime), status (int), message (String), path (String)',
    starter_code = 'import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.web.context.request.WebRequest;

// TODO: Create @ControllerAdvice class
// TODO: Handle ResourceNotFoundException -> 404
// TODO: Handle MethodArgumentNotValidException -> 400
// TODO: Handle Exception -> 500
// TODO: Create ErrorResponse DTO with timestamp, status, message, path',
    hints_json = '[{"id":"h1","text":"Use @RestControllerAdvice (combines @ControllerAdvice + @ResponseBody)"},{"id":"h2","text":"Each handler method gets @ExceptionHandler(SpecificException.class) and @ResponseStatus"},{"id":"h3","text":"ErrorResponse should have: LocalDateTime timestamp, int status, String message, String path"},{"id":"h4","text":"Use WebRequest.getDescription(false) to get the request path"}]'
WHERE title = 'Global Exception Handling';

UPDATE challenges SET
    description = 'Create an OrderService that calls an external product-service using WebClient.

▸ Call GET /api/products/{id} on http://product-service
▸ Configure connect timeout: 2 seconds; read timeout: 5 seconds
▸ Add @CircuitBreaker(name, fallbackMethod) with a fallback that accepts Throwable
▸ Handle 4xx client errors and 5xx server errors gracefully
▸ Return a safe fallback value when the circuit is open or the call fails',
    starter_code = 'import org.springframework.web.reactive.function.client.WebClient;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import java.time.Duration;

// TODO: Create OrderService with WebClient
// TODO: Configure timeouts (2s connect, 5s read)
// TODO: Add @CircuitBreaker with fallback method
// TODO: Handle 4xx/5xx error responses

public class OrderService {
    private final WebClient webClient;

    // TODO: Implement getProduct(Long productId)
    // TODO: Implement fallback method
}',
    hints_json = '[{"id":"h1","text":"Use WebClient.builder().baseUrl(...).build() and inject it as a bean"},{"id":"h2","text":"Configure timeouts: HttpClient.create().option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 2000)"},{"id":"h3","text":"Add @CircuitBreaker(name=\"productService\", fallbackMethod=\"getProductFallback\")"},{"id":"h4","text":"Use .onStatus(HttpStatusCode::is4xxClientError, ...) for error handling"}]'
WHERE title = 'WebClient & Circuit Breaker';

UPDATE challenges SET
    description = 'Configure Spring Security with stateless JWT authentication.

▸ SecurityFilterChain bean: disable CSRF, set STATELESS session policy
▸ Permit all /auth/** without authentication; require auth for everything else
▸ JwtUtil: generate token with Jwts.builder() (subject + expiry), validate token
▸ JwtAuthenticationFilter extends OncePerRequestFilter:
   - Extract Bearer token from Authorization header
   - Validate and set authentication in SecurityContextHolder
▸ POST /auth/login endpoint that returns {"token": "..."}',
    starter_code = 'import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.web.filter.OncePerRequestFilter;
import io.jsonwebtoken.*;

// TODO: SecurityConfig with SecurityFilterChain @Bean
//   - Disable CSRF
//   - Stateless session (STATELESS)
//   - Permit /auth/**
//   - JwtAuthenticationFilter before UsernamePasswordAuthenticationFilter

// TODO: JwtUtil - generate token with Jwts.builder(), validate token

// TODO: JwtAuthenticationFilter extends OncePerRequestFilter
//   - Extract Bearer token from Authorization header
//   - Validate and set SecurityContext

// TODO: POST /auth/login -> returns {token: "..."}',
    hints_json = '[{"id":"h1","text":"Use http.csrf(csrf -> csrf.disable()) and sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))"},{"id":"h2","text":"Use Keys.hmacShaKeyFor(secret.getBytes()) for the signing key"},{"id":"h3","text":"In the filter, extract token from Authorization header, validate with Jwts.parserBuilder()"},{"id":"h4","text":"Set SecurityContextHolder.getContext().setAuthentication(auth) after validation"}]'
WHERE title = 'JWT Security Configuration';
