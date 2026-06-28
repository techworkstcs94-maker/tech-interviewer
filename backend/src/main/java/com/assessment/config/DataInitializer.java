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
                "Build a RESTful ProductController with two endpoints.\n\n" +
                "▸ GET /api/products — return all products (200 OK)\n" +
                "▸ GET /api/products/{id} — return single product (200 OK) or 404 if not found\n\n" +
                "Product fields: id (Long), name (String), price (Double), category (String)\n\n" +
                "Use @RestController, @RequestMapping(\"/api/products\"), @GetMapping, @PathVariable, and ResponseEntity.",
                "@RestController\n@RequestMapping(\"/api/products\")\npublic class ProductController {\n    private List<Product> products = new ArrayList<>();\n\n    // TODO: Implement GET /api/products - return all products\n    // TODO: Implement GET /api/products/{id} - return product or 404\n}\n\nclass Product {\n    // TODO: Add fields: id (Long), name (String), price (Double), category (String)\n}",
                "[{\"id\":\"t1\",\"label\":\"@RestController annotation present\",\"weight\":20},{\"id\":\"t2\",\"label\":\"@GetMapping for list endpoint\",\"weight\":20},{\"id\":\"t3\",\"label\":\"@PathVariable for ID parameter\",\"weight\":20},{\"id\":\"t4\",\"label\":\"404 handling present\",\"weight\":20},{\"id\":\"t5\",\"label\":\"Product model with required fields\",\"weight\":20}]",
                "[{\"id\":\"h1\",\"text\":\"Use @RestController on your controller class\"},{\"id\":\"h2\",\"text\":\"Use @GetMapping for GET endpoints, @PathVariable for URL parameters\"},{\"id\":\"h3\",\"text\":\"Return ResponseEntity.notFound().build() when product is not found\"},{\"id\":\"h4\",\"text\":\"Initialize your products list with some sample data for testing\"}]",
                "[\"@RestController\",\"@GetMapping\",\"@PathVariable\",\"ResponseEntity\",\"Spring MVC\"]"
            ),
            challenge(
                "Service Layer Pattern", "MEDIUM", "Spring Core", 900,
                "Implement the Service Layer Pattern with interface + implementation.\n\n" +
                "▸ Define a ProductService interface with your service methods\n" +
                "▸ Create ProductServiceImpl with @Service annotation\n" +
                "▸ Use constructor injection — declare fields as final, no @Autowired on fields\n" +
                "▸ Validate: price must be > 0; name must not be blank\n" +
                "▸ Throw a custom exception class (not RuntimeException directly) when validation fails",
                "public interface ProductService {\n    // TODO: Define service methods\n}\n\n// TODO: Create ProductServiceImpl with @Service\n// TODO: Use constructor injection\n// TODO: Validate price > 0 and name not blank\n// TODO: Create a custom exception class",
                "[{\"id\":\"t1\",\"label\":\"@Service on implementation class\",\"weight\":17},{\"id\":\"t2\",\"label\":\"Implements service interface\",\"weight\":17},{\"id\":\"t3\",\"label\":\"Constructor injection (no @Autowired field)\",\"weight\":17},{\"id\":\"t4\",\"label\":\"Price > 0 validation\",\"weight\":17},{\"id\":\"t5\",\"label\":\"Non-blank name validation\",\"weight\":16},{\"id\":\"t6\",\"label\":\"Custom exception thrown\",\"weight\":16}]",
                "[{\"id\":\"h1\",\"text\":\"Use @Service on the implementation class, not the interface\"},{\"id\":\"h2\",\"text\":\"Declare dependencies as final fields and create a constructor\"},{\"id\":\"h3\",\"text\":\"Check price <= 0 or name.isBlank() and throw your custom exception\"},{\"id\":\"h4\",\"text\":\"Create a class like ProductValidationException that extends RuntimeException\"}]",
                "[\"@Service\",\"Constructor Injection\",\"Interface Pattern\",\"Input Validation\",\"Custom Exceptions\"]"
            ),
            challenge(
                "Spring Data JPA", "MEDIUM", "JPA", 900,
                "Set up JPA persistence for Product using Spring Data JPA.\n\n" +
                "▸ Annotate Product with @Entity, @Id, @GeneratedValue\n" +
                "▸ Create ProductRepository extending JpaRepository<Product, Long>\n" +
                "▸ Add derived query: findByCategory(String category)\n" +
                "▸ Add @Query method to filter products by a maximum price using JPQL\n" +
                "▸ Configure H2 in-memory datasource in application.properties",
                "import jakarta.persistence.*;\nimport org.springframework.data.jpa.repository.*;\nimport org.springframework.data.repository.query.Param;\n\n// TODO: Create Product @Entity with @Id, @GeneratedValue\n// TODO: Create ProductRepository extending JpaRepository\n// TODO: Add findByCategory derived query\n// TODO: Add @Query for price filter\n\n// application.properties:\n// spring.datasource.url=jdbc:h2:mem:testdb\n// spring.datasource.driver-class-name=org.h2.Driver",
                "[{\"id\":\"t1\",\"label\":\"@Entity on Product class\",\"weight\":17},{\"id\":\"t2\",\"label\":\"@Id and @GeneratedValue present\",\"weight\":17},{\"id\":\"t3\",\"label\":\"Extends JpaRepository\",\"weight\":17},{\"id\":\"t4\",\"label\":\"findByCategory derived query\",\"weight\":17},{\"id\":\"t5\",\"label\":\"@Query for price filter\",\"weight\":16},{\"id\":\"t6\",\"label\":\"H2/datasource configured\",\"weight\":16}]",
                "[{\"id\":\"h1\",\"text\":\"Annotate the entity class with @Entity and @Table(name=\\\"products\\\")\"},{\"id\":\"h2\",\"text\":\"Use @Id and @GeneratedValue(strategy=GenerationType.IDENTITY) on the id field\"},{\"id\":\"h3\",\"text\":\"Spring Data derives the query automatically from findByCategory method name\"},{\"id\":\"h4\",\"text\":\"Use @Query(\\\"SELECT p FROM Product p WHERE p.price <= :maxPrice\\\") for custom queries\"}]",
                "[\"@Entity\",\"JpaRepository\",\"Derived Queries\",\"@Query\",\"JPQL\",\"H2 Database\"]"
            ),
            challenge(
                "Global Exception Handling", "MEDIUM", "Spring MVC", 720,
                "Build a global exception handler using @ControllerAdvice.\n\n" +
                "▸ Handle ResourceNotFoundException → HTTP 404\n" +
                "▸ Handle MethodArgumentNotValidException → HTTP 400\n" +
                "▸ Handle generic Exception → HTTP 500\n\n" +
                "Each handler must return an ErrorResponse DTO with:\n" +
                "  timestamp (LocalDateTime), status (int), message (String), path (String)",
                "import org.springframework.web.bind.annotation.*;\nimport org.springframework.http.*;\nimport org.springframework.web.context.request.WebRequest;\n\n// TODO: Create @ControllerAdvice class\n// TODO: Handle ResourceNotFoundException -> 404\n// TODO: Handle MethodArgumentNotValidException -> 400\n// TODO: Handle Exception -> 500\n// TODO: Create ErrorResponse DTO with timestamp, status, message, path",
                "[{\"id\":\"t1\",\"label\":\"@ControllerAdvice present\",\"weight\":20},{\"id\":\"t2\",\"label\":\"ResourceNotFoundException → 404\",\"weight\":20},{\"id\":\"t3\",\"label\":\"MethodArgumentNotValidException → 400\",\"weight\":20},{\"id\":\"t4\",\"label\":\"Generic Exception → 500\",\"weight\":20},{\"id\":\"t5\",\"label\":\"ErrorResponse DTO returned\",\"weight\":20}]",
                "[{\"id\":\"h1\",\"text\":\"Use @RestControllerAdvice (combines @ControllerAdvice + @ResponseBody)\"},{\"id\":\"h2\",\"text\":\"Each handler method gets @ExceptionHandler(SpecificException.class) and @ResponseStatus\"},{\"id\":\"h3\",\"text\":\"ErrorResponse should have: LocalDateTime timestamp, int status, String message, String path\"},{\"id\":\"h4\",\"text\":\"Use WebRequest.getDescription(false) to get the request path\"}]",
                "[\"@ControllerAdvice\",\"@ExceptionHandler\",\"@ResponseStatus\",\"ErrorResponse\",\"Global Exception Handling\"]"
            ),
            challenge(
                "WebClient & Circuit Breaker", "HARD", "Microservices", 1200,
                "Create an OrderService that calls an external product-service using WebClient.\n\n" +
                "▸ Call GET /api/products/{id} on http://product-service\n" +
                "▸ Configure connect timeout: 2 seconds; read timeout: 5 seconds\n" +
                "▸ Add @CircuitBreaker(name, fallbackMethod) with a fallback that accepts Throwable\n" +
                "▸ Handle 4xx client errors and 5xx server errors gracefully\n" +
                "▸ Return a safe fallback value when the circuit is open or the call fails",
                "import org.springframework.web.reactive.function.client.WebClient;\nimport io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;\nimport java.time.Duration;\n\n// TODO: Create OrderService with WebClient\n// TODO: Configure timeouts (2s connect, 5s read)\n// TODO: Add @CircuitBreaker with fallback method\n// TODO: Handle 4xx/5xx error responses\n\npublic class OrderService {\n    private final WebClient webClient;\n\n    // TODO: Implement getProduct(Long productId)\n    // TODO: Implement fallback method\n}",
                "[{\"id\":\"t1\",\"label\":\"WebClient configured\",\"weight\":17},{\"id\":\"t2\",\"label\":\"HTTP call implemented\",\"weight\":17},{\"id\":\"t3\",\"label\":\"@CircuitBreaker annotation\",\"weight\":17},{\"id\":\"t4\",\"label\":\"Fallback method present\",\"weight\":17},{\"id\":\"t5\",\"label\":\"Timeout configuration\",\"weight\":16},{\"id\":\"t6\",\"label\":\"Error handling for 4xx/5xx\",\"weight\":16}]",
                "[{\"id\":\"h1\",\"text\":\"Use WebClient.builder().baseUrl(...).build() and inject it as a bean\"},{\"id\":\"h2\",\"text\":\"Configure timeouts: HttpClient.create().option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 2000)\"},{\"id\":\"h3\",\"text\":\"Add @CircuitBreaker(name=\\\"productService\\\", fallbackMethod=\\\"getProductFallback\\\")\"},{\"id\":\"h4\",\"text\":\"Use .onStatus(HttpStatusCode::is4xxClientError, ...) for error handling\"}]",
                "[\"WebClient\",\"Circuit Breaker\",\"Resilience4j\",\"Timeout Configuration\",\"Reactive Programming\",\"Microservices\"]"
            ),
            challenge(
                "JWT Security Configuration", "HARD", "Security", 1500,
                "Configure Spring Security with stateless JWT authentication.\n\n" +
                "▸ SecurityFilterChain bean: disable CSRF, set STATELESS session policy\n" +
                "▸ Permit all /auth/** without authentication; require auth for everything else\n" +
                "▸ JwtUtil: generate token with Jwts.builder() (subject + expiry), validate token\n" +
                "▸ JwtAuthenticationFilter extends OncePerRequestFilter:\n" +
                "   - Extract Bearer token from Authorization header\n" +
                "   - Validate and set authentication in SecurityContextHolder\n" +
                "▸ POST /auth/login endpoint that returns {\"token\": \"...\"}",
                "import org.springframework.security.config.annotation.web.builders.HttpSecurity;\nimport org.springframework.security.config.http.SessionCreationPolicy;\nimport org.springframework.web.filter.OncePerRequestFilter;\nimport io.jsonwebtoken.*;\n\n// TODO: SecurityConfig with SecurityFilterChain @Bean\n//   - Disable CSRF\n//   - Stateless session (STATELESS)\n//   - Permit /auth/**\n//   - JwtAuthenticationFilter before UsernamePasswordAuthenticationFilter\n\n// TODO: JwtUtil - generate token with Jwts.builder(), validate token\n\n// TODO: JwtAuthenticationFilter extends OncePerRequestFilter\n//   - Extract Bearer token from Authorization header\n//   - Validate and set SecurityContext\n\n// TODO: POST /auth/login -> returns {token: \"...\"}",
                "[{\"id\":\"t1\",\"label\":\"SecurityFilterChain bean\",\"weight\":15},{\"id\":\"t2\",\"label\":\"CSRF disabled\",\"weight\":14},{\"id\":\"t3\",\"label\":\"/auth/** permitted\",\"weight\":14},{\"id\":\"t4\",\"label\":\"Stateless session policy\",\"weight\":14},{\"id\":\"t5\",\"label\":\"JwtAuthenticationFilter extends OncePerRequestFilter\",\"weight\":14},{\"id\":\"t6\",\"label\":\"JWT generation with claims\",\"weight\":15},{\"id\":\"t7\",\"label\":\"Login endpoint returns token\",\"weight\":14}]",
                "[{\"id\":\"h1\",\"text\":\"Use http.csrf(csrf -> csrf.disable()) and sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))\"},{\"id\":\"h2\",\"text\":\"Use Keys.hmacShaKeyFor(secret.getBytes()) for the signing key\"},{\"id\":\"h3\",\"text\":\"In the filter, extract token from Authorization header, validate with Jwts.parserBuilder()\"},{\"id\":\"h4\",\"text\":\"Set SecurityContextHolder.getContext().setAuthentication(auth) after validation\"}]",
                "[\"Spring Security\",\"JWT\",\"OncePerRequestFilter\",\"SecurityFilterChain\",\"CSRF\",\"Stateless Session\"]"
            )
            ,
            challenge(
                "Kafka Producer Basics", "EASY", "Kafka", 600,
                "Implement a Kafka producer service that publishes order events using KafkaTemplate.\n\n" +
                "▸ Annotate the class as a Spring @Service\n" +
                "▸ Inject KafkaTemplate<String, String> via constructor injection (final field, no @Autowired)\n" +
                "▸ Implement sendOrderEvent(String orderId, String payload) that sends to the \"orders\" topic\n" +
                "▸ Use orderId as the message key so related events land on the same partition\n\n" +
                "Concept check: KafkaTemplate.send(topic, key, value) routes messages with the same key to the same partition, enabling ordered processing per entity.",
                "import org.springframework.kafka.core.KafkaTemplate;\nimport org.springframework.stereotype.Service;\n\n" +
                "// TODO: Annotate as @Service\n" +
                "// TODO: Inject KafkaTemplate<String, String> via constructor injection\n" +
                "// TODO: Implement sendOrderEvent(String orderId, String payload)\n" +
                "//       Send to topic \"orders\" using orderId as the message key\n\n" +
                "public class OrderEventProducer {\n" +
                "    // TODO: Declare KafkaTemplate field (final)\n\n" +
                "    // TODO: Implement sendOrderEvent\n" +
                "}",
                "[{\"id\":\"t1\",\"label\":\"@Service annotation present\",\"weight\":20},{\"id\":\"t2\",\"label\":\"KafkaTemplate field declared\",\"weight\":20},{\"id\":\"t3\",\"label\":\"Constructor injection used\",\"weight\":20},{\"id\":\"t4\",\"label\":\"kafkaTemplate.send() called\",\"weight\":20},{\"id\":\"t5\",\"label\":\"\\\"orders\\\" topic referenced\",\"weight\":20}]",
                "[{\"id\":\"h1\",\"text\":\"Annotate the class with @Service so Spring manages the bean lifecycle\"},{\"id\":\"h2\",\"text\":\"Declare private final KafkaTemplate<String, String> kafkaTemplate and create a constructor\"},{\"id\":\"h3\",\"text\":\"Use kafkaTemplate.send(\\\"orders\\\", orderId, payload) — key ensures partition affinity\"},{\"id\":\"h4\",\"text\":\"The key parameter routes all events with the same orderId to the same partition, preserving order\"}]",
                "[\"KafkaTemplate\",\"Producer\",\"Topic\",\"Partition Key\",\"Constructor Injection\",\"Event-Driven\"]"
            ),
            challenge(
                "Kafka Consumer Groups", "MEDIUM", "Kafka", 900,
                "Implement a Kafka consumer that processes order events using @KafkaListener.\n\n" +
                "▸ Annotate the class as a Spring @Component\n" +
                "▸ Create a method processOrder(ConsumerRecord<String, String> record) annotated with @KafkaListener\n" +
                "▸ Set topics = {\"orders\"} and groupId = \"order-processors\" on the listener\n" +
                "▸ Log the record key (orderId) and value (payload)\n" +
                "▸ Call acknowledgment.acknowledge() to commit the offset manually\n\n" +
                "Concept check: Consumer group ID determines which consumers share the workload. Each partition is assigned to exactly one consumer in a group — scaling consumers beyond partition count gives no throughput gain.",
                "import org.apache.kafka.clients.consumer.ConsumerRecord;\nimport org.springframework.kafka.annotation.KafkaListener;\nimport org.springframework.kafka.support.Acknowledgment;\nimport org.springframework.stereotype.Component;\nimport lombok.extern.slf4j.Slf4j;\n\n" +
                "// TODO: Annotate as @Component and add @Slf4j\n" +
                "// TODO: Implement processOrder(ConsumerRecord<String, String> record, Acknowledgment ack)\n" +
                "// TODO: Add @KafkaListener(topics = {\"orders\"}, groupId = \"order-processors\")\n" +
                "// TODO: Log record.key() and record.value()\n" +
                "// TODO: Call ack.acknowledge() to commit the offset\n\n" +
                "public class OrderEventConsumer {\n" +
                "    // TODO: Implement processOrder\n" +
                "}",
                "[{\"id\":\"t1\",\"label\":\"@Component annotation present\",\"weight\":20},{\"id\":\"t2\",\"label\":\"@KafkaListener annotation used\",\"weight\":20},{\"id\":\"t3\",\"label\":\"groupId = \\\"order-processors\\\" set\",\"weight\":20},{\"id\":\"t4\",\"label\":\"ConsumerRecord parameter used\",\"weight\":20},{\"id\":\"t5\",\"label\":\"acknowledge() called for manual commit\",\"weight\":20}]",
                "[{\"id\":\"h1\",\"text\":\"Use @Component on the class; @KafkaListener goes on the method\"},{\"id\":\"h2\",\"text\":\"@KafkaListener(topics = {\\\"orders\\\"}, groupId = \\\"order-processors\\\") wires the method to the topic\"},{\"id\":\"h3\",\"text\":\"Add Acknowledgment ack as a second method parameter to enable manual offset commit\"},{\"id\":\"h4\",\"text\":\"Always call ack.acknowledge() after successful processing — skipping this causes reprocessing on restart\"}]",
                "[\"@KafkaListener\",\"Consumer Group\",\"ConsumerRecord\",\"Manual Acknowledgment\",\"Offset Management\",\"Partition Assignment\"]"
            ),
            challenge(
                "Dead Letter Topic Pattern", "MEDIUM", "Kafka", 900,
                "Implement retry logic and a Dead Letter Topic (DLT) for a payment event consumer.\n\n" +
                "▸ Annotate the class as a Spring @Component\n" +
                "▸ Add @RetryableTopic(attempts = \"3\", backoff = @Backoff(delay = 1000, multiplier = 2.0)) above the listener\n" +
                "▸ Listen to the \"payments\" topic with groupId = \"payment-processors\"\n" +
                "▸ Simulate a transient failure by throwing RuntimeException for malformed payloads\n" +
                "▸ Add a separate @DltHandler method to log and store permanently failed messages\n\n" +
                "Concept check: @RetryableTopic creates intermediate retry topics automatically. After all retries are exhausted the message is forwarded to payments-dlt, keeping the main topic unblocked.",
                "import org.springframework.kafka.annotation.DltHandler;\nimport org.springframework.kafka.annotation.KafkaListener;\nimport org.springframework.kafka.annotation.RetryableTopic;\nimport org.springframework.retry.annotation.Backoff;\nimport org.springframework.stereotype.Component;\nimport lombok.extern.slf4j.Slf4j;\n\n" +
                "// TODO: Annotate as @Component and @Slf4j\n" +
                "// TODO: Add @RetryableTopic(attempts = \"3\", backoff = @Backoff(delay = 1000, multiplier = 2.0))\n" +
                "// TODO: Add @KafkaListener(topics = \"payments\", groupId = \"payment-processors\")\n" +
                "// TODO: Throw RuntimeException for payload == null or blank\n" +
                "// TODO: Add @DltHandler method to handle permanently failed messages\n\n" +
                "public class PaymentEventConsumer {\n\n" +
                "    // TODO: Implement processPayment(String payload) with retry + listener annotations\n\n" +
                "    // TODO: Implement handleDlt(String payload) with @DltHandler\n" +
                "}",
                "[{\"id\":\"t1\",\"label\":\"@Component annotation present\",\"weight\":16},{\"id\":\"t2\",\"label\":\"@RetryableTopic annotation used\",\"weight\":17},{\"id\":\"t3\",\"label\":\"@Backoff configured on retry\",\"weight\":17},{\"id\":\"t4\",\"label\":\"@KafkaListener for payments topic\",\"weight\":17},{\"id\":\"t5\",\"label\":\"RuntimeException thrown for invalid payload\",\"weight\":17},{\"id\":\"t6\",\"label\":\"@DltHandler method present\",\"weight\":16}]",
                "[{\"id\":\"h1\",\"text\":\"@RetryableTopic must be placed directly above @KafkaListener on the same method\"},{\"id\":\"h2\",\"text\":\"attempts = \\\"3\\\" means 1 original attempt + 2 retries before the DLT\"},{\"id\":\"h3\",\"text\":\"The @DltHandler method receives the same payload type as the listener — use it to log or persist the failure\"},{\"id\":\"h4\",\"text\":\"Exponential backoff: delay 1 s → 2 s → 4 s; multiplier controls the growth rate\"}]",
                "[\"@RetryableTopic\",\"Dead Letter Topic\",\"@DltHandler\",\"@Backoff\",\"Retry Policy\",\"Fault Tolerance\",\"Event-Driven\"]"
            ),
            challenge(
                "Transactional Kafka Producer", "HARD", "Kafka", 1200,
                "Implement exactly-once semantics by combining a database write with a Kafka publish inside a single transaction.\n\n" +
                "▸ Create TransactionalOrderService annotated with @Service\n" +
                "▸ Inject both an OrderRepository and a KafkaTemplate via constructor injection\n" +
                "▸ Implement processOrder(Order order) annotated with @Transactional\n" +
                "▸ Inside the method: save the order via repository, then publish to \"order-events\" topic\n" +
                "▸ Create a @Configuration class KafkaProducerConfig that declares a ProducerFactory bean with transactionalIdPrefix = \"order-tx-\"\n\n" +
                "Concept check: Setting transactional.id on the producer enables idempotent delivery and multi-partition atomicity. If the DB commit rolls back, the Kafka send is also aborted — preventing ghost events from reaching consumers.",
                "import org.springframework.kafka.core.KafkaTemplate;\nimport org.springframework.kafka.core.ProducerFactory;\nimport org.springframework.kafka.core.DefaultKafkaProducerFactory;\nimport org.springframework.transaction.annotation.Transactional;\nimport org.springframework.stereotype.Service;\nimport org.springframework.context.annotation.Bean;\nimport org.springframework.context.annotation.Configuration;\n\n" +
                "// TODO: Create TransactionalOrderService @Service\n" +
                "//   - Inject KafkaTemplate and OrderRepository (constructor injection)\n" +
                "//   - Implement processOrder(@Transactional):\n" +
                "//       1. repository.save(order)\n" +
                "//       2. kafkaTemplate.send(\"order-events\", order.getId().toString(), order.toString())\n\n" +
                "// TODO: Create KafkaProducerConfig @Configuration\n" +
                "//   - ProducerFactory @Bean with transactionalIdPrefix = \"order-tx-\"\n" +
                "//   - KafkaTemplate @Bean using the factory above\n\n" +
                "public class TransactionalOrderService {\n" +
                "    // TODO: Implement processOrder\n" +
                "}\n\n" +
                "class KafkaProducerConfig {\n" +
                "    // TODO: Declare ProducerFactory and KafkaTemplate beans\n" +
                "}",
                "[{\"id\":\"t1\",\"label\":\"@Service on TransactionalOrderService\",\"weight\":14},{\"id\":\"t2\",\"label\":\"@Transactional on processOrder\",\"weight\":15},{\"id\":\"t3\",\"label\":\"repository.save() called\",\"weight\":14},{\"id\":\"t4\",\"label\":\"kafkaTemplate.send() called\",\"weight\":14},{\"id\":\"t5\",\"label\":\"@Configuration on KafkaProducerConfig\",\"weight\":14},{\"id\":\"t6\",\"label\":\"ProducerFactory @Bean declared\",\"weight\":15},{\"id\":\"t7\",\"label\":\"transactionalIdPrefix configured\",\"weight\":14}]",
                "[{\"id\":\"h1\",\"text\":\"@Transactional wraps both the DB save and the Kafka send — if either fails, both roll back\"},{\"id\":\"h2\",\"text\":\"Use DefaultKafkaProducerFactory and call factory.setTransactionIdPrefix(\\\"order-tx-\\\") in the bean\"},{\"id\":\"h3\",\"text\":\"KafkaTemplate must be created from the transactional ProducerFactory, not the default auto-configured one\"},{\"id\":\"h4\",\"text\":\"Spring's KafkaTransactionManager participates in the same transaction as JPA when both are configured correctly\"}]",
                "[\"@Transactional\",\"Exactly-Once Semantics\",\"Transactional Producer\",\"Idempotent Producer\",\"ProducerFactory\",\"KafkaTemplate\",\"Outbox Pattern\"]"
            )
        ));
        log.info("Seeded 10 challenges successfully.");
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
