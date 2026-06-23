package com.assessment.controller;

import com.assessment.dto.SessionReportDto;
import com.assessment.model.CheatEvent;
import com.assessment.model.Submission;
import com.assessment.repository.CandidateSessionRepository;
import com.assessment.repository.CheatEventRepository;
import com.assessment.repository.SubmissionRepository;
import com.assessment.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;

@RestController
@RequestMapping("/api/recruiter")
@RequiredArgsConstructor
public class RecruiterController {

    private final CandidateSessionRepository sessionRepository;
    private final SubmissionRepository submissionRepository;
    private final CheatEventRepository cheatEventRepository;
    private final JwtUtil jwtUtil;

    @GetMapping("/sessions")
    public ResponseEntity<List<Map<String, Object>>> getAllSessions() {
        List<Map<String, Object>> sessions = sessionRepository.findAll().stream()
                .map(session -> {
                    List<Submission> subs = submissionRepository.findBySessionId(session.getSessionId());
                    List<CheatEvent> events = cheatEventRepository.findBySessionIdOrderByOccurredAtAsc(session.getSessionId());
                    OptionalDouble avgInstant = subs.stream()
                            .filter(s -> s.getInstantScore() != null)
                            .mapToInt(Submission::getInstantScore).average();
                    OptionalDouble avgDeep = subs.stream()
                            .filter(s -> s.getDeepScore() != null)
                            .mapToInt(Submission::getDeepScore).average();
                    int cheatScore = events.stream().mapToInt(e -> severityPoints(e.getSeverity())).sum();
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("sessionId", session.getSessionId());
                    m.put("candidateName", session.getCandidateName());
                    m.put("candidateEmail", session.getCandidateEmail());
                    m.put("startTime", session.getStartTime() != null ? session.getStartTime().toString() : "");
                    m.put("endTime", session.getEndTime() != null ? session.getEndTime().toString() : "");
                    m.put("status", session.getStatus().name());
                    m.put("submissionCount", subs.size());
                    m.put("avgInstantScore", avgInstant.orElse(0));
                    m.put("avgDeepScore", avgDeep.orElse(0));
                    m.put("cheatScore", cheatScore);
                    m.put("cheatEventCount", events.size());
                    return m;
                })
                .toList();
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<?> getSessionDetail(@PathVariable String sessionId) {
        return sessionRepository.findBySessionId(sessionId)
                .map(session -> {
                    List<Submission> subs = submissionRepository.findBySessionIdOrderByChallengeIdAsc(sessionId);
                    List<CheatEvent> events = cheatEventRepository.findBySessionIdOrderByOccurredAtAsc(sessionId);
                    OptionalDouble avgInstant = subs.stream()
                            .filter(s -> s.getInstantScore() != null)
                            .mapToInt(Submission::getInstantScore).average();
                    OptionalDouble avgDeep = subs.stream()
                            .filter(s -> s.getDeepScore() != null)
                            .mapToInt(Submission::getDeepScore).average();
                    int cheatScore = events.stream().mapToInt(e -> severityPoints(e.getSeverity())).sum();
                    return ResponseEntity.ok(new SessionReportDto(
                            session.getSessionId(), session.getCandidateName(), session.getCandidateEmail(),
                            session.getStartTime(), session.getEndTime(), session.getStatus().name(),
                            subs, avgInstant.orElse(0), avgDeep.orElse(0),
                            events, cheatScore
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<?> deleteSession(@PathVariable String sessionId) {
        return sessionRepository.findBySessionId(sessionId)
                .map(session -> {
                    cheatEventRepository.deleteBySessionId(sessionId);
                    submissionRepository.deleteBySessionId(sessionId);
                    sessionRepository.delete(session);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping(value = "/report-html", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getReportHtml(@RequestParam(required = false) String token) {
        if (token == null || !jwtUtil.isTokenValid(token) || !"RECRUITER".equals(jwtUtil.extractRole(token))) {
            return ResponseEntity.status(403)
                    .contentType(MediaType.TEXT_HTML)
                    .body("<html><body style='font-family:sans-serif;padding:40px'><h2>403 Forbidden</h2><p>Valid recruiter token required.</p></body></html>");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(generateSolutionsHtml());
    }

    private String diffColor(String difficulty) {
        return switch (difficulty) {
            case "EASY"   -> "#4edea3";
            case "MEDIUM" -> "#ffd59c";
            default       -> "#ffb4ab";
        };
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private String generateSolutionsHtml() {
        record Ch(String id, String title, String difficulty, String category, String solution) {}

        List<Ch> challenges = List.of(
            new Ch("ch1", "REST Controller Basics", "EASY", "Spring MVC",
                "@RestController\n@RequestMapping(\"/api/products\")\nclass ProductController {\n\n    private final List<Product> products = new ArrayList<>();\n    private final AtomicLong ids = new AtomicLong(0);\n\n    ProductController() {\n        products.add(new Product(ids.incrementAndGet(), \"Mechanical Keyboard\", 89.99, \"Peripherals\"));\n        products.add(new Product(ids.incrementAndGet(), \"27\\\" Monitor\", 199.50, \"Displays\"));\n        products.add(new Product(ids.incrementAndGet(), \"USB-C Hub\", 34.00, \"Accessories\"));\n    }\n\n    @GetMapping\n    public List<Product> getProducts() { return products; }\n\n    @GetMapping(\"/{id}\")\n    public Product getProductById(@PathVariable Long id) {\n        return products.stream()\n                .filter(p -> p.getId().equals(id))\n                .findFirst()\n                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, \"Product not found\"));\n    }\n}\n\nclass Product {\n    private Long id;\n    private String name;\n    private Double price;\n    private String category;\n    // constructor, getters, setters\n}"
            ),
            new Ch("ch2", "Service Layer Pattern", "MEDIUM", "Spring Core",
                "// Interface\npublic interface ProductService {\n    Product create(Product product);\n    List<Product> findAll();\n}\n\n// Implementation — constructor injection, custom exception\n@Service\nclass ProductServiceImpl implements ProductService {\n\n    private final List<Product> store = new ArrayList<>();\n    private final AtomicLong ids = new AtomicLong(0);\n\n    @Override\n    public Product create(Product product) {\n        if (product.getPrice() == null || product.getPrice() <= 0)\n            throw new ProductValidationException(\"Price must be greater than 0\");\n        if (product.getName() == null || product.getName().isBlank())\n            throw new ProductValidationException(\"Name must not be blank\");\n        product.setId(ids.incrementAndGet());\n        store.add(product);\n        return product;\n    }\n\n    @Override\n    public List<Product> findAll() { return store; }\n}\n\n// Controller uses the interface type\n@RestController\n@RequestMapping(\"/api/products\")\nclass ProductController {\n    private final ProductService productService;\n\n    ProductController(ProductService productService) { this.productService = productService; }\n\n    @GetMapping\n    public List<Product> all() { return productService.findAll(); }\n\n    @PostMapping\n    public ResponseEntity<Product> create(@Valid @RequestBody Product product) {\n        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(product));\n    }\n}\n\nclass ProductValidationException extends RuntimeException {\n    public ProductValidationException(String message) { super(message); }\n}"
            ),
            new Ch("ch3", "Spring Data JPA", "MEDIUM", "JPA",
                "// Entity\n@Entity\n@Table(name = \"products\")\nclass Product {\n    @Id\n    @GeneratedValue(strategy = GenerationType.IDENTITY)\n    private Long id;\n    private String name;\n    private Double price;\n    private String category;\n    // getters, setters\n}\n\n// Repository — derived query + JPQL @Query\npublic interface ProductRepository extends JpaRepository<Product, Long> {\n    List<Product> findByCategory(String category);\n\n    @Query(\"SELECT p FROM Product p WHERE p.price <= :maxPrice\")\n    List<Product> findByMaxPrice(@Param(\"maxPrice\") Double maxPrice);\n}\n\n// Controller\n@RestController\n@RequestMapping(\"/api/products\")\nclass ProductController {\n    private final ProductRepository repo;\n\n    ProductController(ProductRepository repo) { this.repo = repo; }\n\n    @GetMapping\n    List<Product> all() { return repo.findAll(); }\n\n    @PostMapping\n    ResponseEntity<Product> create(@RequestBody Product product) {\n        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(product));\n    }\n\n    @GetMapping(\"/by-category\")\n    List<Product> byCategory(@RequestParam String category) { return repo.findByCategory(category); }\n\n    @GetMapping(\"/by-max-price\")\n    List<Product> byMaxPrice(@RequestParam Double maxPrice) { return repo.findByMaxPrice(maxPrice); }\n}\n\n# application.properties\nspring.datasource.url=jdbc:h2:mem:testdb\nspring.datasource.driver-class-name=org.h2.Driver\nspring.jpa.hibernate.ddl-auto=create-drop"
            ),
            new Ch("ch4", "Global Exception Handling", "MEDIUM", "Spring MVC",
                "// Custom exception\nclass ResourceNotFoundException extends RuntimeException {\n    public ResourceNotFoundException(String message) { super(message); }\n}\n\n// ErrorResponse DTO\nclass ErrorResponse {\n    private String timestamp;\n    private int status;\n    private String message;\n    private String path;\n    private List<String> errors;\n    // constructor + getters\n}\n\n// Global handler\n@RestControllerAdvice\nclass GlobalExceptionHandler {\n\n    @ExceptionHandler(ResourceNotFoundException.class)\n    ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex, HttpServletRequest req) {\n        return build(HttpStatus.NOT_FOUND, ex.getMessage(), req, null);\n    }\n\n    @ExceptionHandler(MethodArgumentNotValidException.class)\n    ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {\n        List<String> errors = ex.getBindingResult().getFieldErrors().stream()\n                .map(f -> f.getField() + \": \" + f.getDefaultMessage())\n                .toList();\n        return build(HttpStatus.BAD_REQUEST, \"Validation failed\", req, errors);\n    }\n\n    @ExceptionHandler(Exception.class)\n    ResponseEntity<ErrorResponse> handleGeneric(Exception ex, HttpServletRequest req) {\n        return build(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage(), req, null);\n    }\n\n    private ResponseEntity<ErrorResponse> build(HttpStatus status, String message,\n                                                HttpServletRequest req, List<String> errs) {\n        return ResponseEntity.status(status).body(new ErrorResponse(\n                Instant.now().toString(), status.value(), message, req.getRequestURI(), errs));\n    }\n}"
            ),
            new Ch("ch5", "WebClient & Circuit Breaker", "HARD", "Microservices",
                "// RestTemplate bean with connect + read timeouts\n@Configuration\nclass ClientConfig {\n    @Bean\n    RestTemplate restTemplate(RestTemplateBuilder builder,\n                              @Value(\"${upstream.timeout-ms:2000}\") long timeoutMs) {\n        return builder\n                .setConnectTimeout(Duration.ofMillis(timeoutMs))\n                .setReadTimeout(Duration.ofMillis(timeoutMs * 2L))\n                .build();\n    }\n}\n\n// Service with @CircuitBreaker and fallback\n@Service\nclass ProductClient {\n    private final RestTemplate restTemplate;\n    private final String baseUrl;\n\n    ProductClient(RestTemplate restTemplate, @Value(\"${upstream.base-url}\") String baseUrl) {\n        this.restTemplate = restTemplate;\n        this.baseUrl = baseUrl;\n    }\n\n    @CircuitBreaker(name = \"productService\", fallbackMethod = \"fallback\")\n    public List<Map<String, Object>> getProducts() {\n        return restTemplate.getForObject(baseUrl + \"/api/products\", List.class);\n    }\n\n    // Fallback — must accept Throwable as last parameter\n    List<Map<String, Object>> fallback(Throwable t) {\n        return List.of(Map.of(\n                \"name\",   \"FALLBACK\",\n                \"source\", \"fallback\",\n                \"reason\", t.getClass().getSimpleName()));\n    }\n}\n\n# application.yml\nresilience4j:\n  circuitbreaker:\n    instances:\n      productService:\n        registerHealthIndicator: true\n        slidingWindowSize: 10\n        failureRateThreshold: 50"
            ),
            new Ch("ch6", "JWT Security Configuration", "HARD", "Security",
                "// SecurityConfig\n@Configuration\n@EnableWebSecurity\nclass SecurityConfig {\n    private final JwtAuthFilter jwtAuthFilter;\n\n    SecurityConfig(JwtAuthFilter jwtAuthFilter) { this.jwtAuthFilter = jwtAuthFilter; }\n\n    @Bean\n    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n        http\n            .csrf(csrf -> csrf.disable())\n            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))\n            .authorizeHttpRequests(auth -> auth\n                .requestMatchers(\"/auth/**\").permitAll()\n                .anyRequest().authenticated())\n            .exceptionHandling(ex -> ex.authenticationEntryPoint(\n                (req, res, e) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED)))\n            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);\n        return http.build();\n    }\n}\n\n// JwtService\n@Service\nclass JwtService {\n    private final SecretKey key;\n    private final long expiryMs;\n\n    JwtService(@Value(\"${security.jwt.secret}\") String secret,\n               @Value(\"${security.jwt.expiry-ms:3600000}\") long expiryMs) {\n        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));\n        this.expiryMs = expiryMs;\n    }\n\n    String generate(String username) {\n        Date now = new Date();\n        return Jwts.builder()\n                .subject(username).issuedAt(now)\n                .expiration(new Date(now.getTime() + expiryMs))\n                .signWith(key).compact();\n    }\n\n    String validateAndGetSubject(String token) {\n        return Jwts.parser().verifyWith(key).build()\n                .parseSignedClaims(token).getPayload().getSubject();\n    }\n}\n\n// JwtAuthFilter\n@Component\nclass JwtAuthFilter extends OncePerRequestFilter {\n    private final JwtService jwtService;\n\n    JwtAuthFilter(JwtService jwtService) { this.jwtService = jwtService; }\n\n    @Override\n    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,\n                                    FilterChain chain) throws ServletException, IOException {\n        String header = req.getHeader(\"Authorization\");\n        if (header != null && header.startsWith(\"Bearer \")) {\n            try {\n                String subject = jwtService.validateAndGetSubject(header.substring(7));\n                SecurityContextHolder.getContext().setAuthentication(\n                    new UsernamePasswordAuthenticationToken(subject, null, AuthorityUtils.NO_AUTHORITIES));\n            } catch (Exception ex) {\n                SecurityContextHolder.clearContext();\n            }\n        }\n        chain.doFilter(req, res);\n    }\n}\n\n// AuthController\n@RestController @RequestMapping(\"/auth\")\nclass AuthController {\n    private final JwtService jwtService;\n    AuthController(JwtService jwtService) { this.jwtService = jwtService; }\n\n    @PostMapping(\"/login\")\n    ResponseEntity<?> login(@RequestBody Map<String, String> creds) {\n        if (\"user\".equals(creds.get(\"username\")) && \"password\".equals(creds.get(\"password\")))\n            return ResponseEntity.ok(Map.of(\"token\", jwtService.generate(creds.get(\"username\"))));\n        return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED).build();\n    }\n}"
            )
        );

        StringBuilder cards = new StringBuilder();
        for (int i = 0; i < challenges.size(); i++) {
            Ch ch = challenges.get(i);
            String color = diffColor(ch.difficulty());
            cards.append("<div class=\"challenge").append(i > 0 ? " page-break" : "").append("\">\n")
                 .append("  <div class=\"ch-header\">")
                 .append("<span class=\"badge\" style=\"background:").append(color).append("22;color:")
                 .append(color).append(";border:1px solid ").append(color).append("55\">")
                 .append(esc(ch.difficulty())).append(" &middot; ").append(esc(ch.category())).append("</span>")
                 .append("<span class=\"ch-id\"><code>").append(esc(ch.id())).append("</code></span>")
                 .append("</div>\n")
                 .append("  <h2>").append(esc(ch.title())).append("</h2>\n")
                 .append("  <pre><code>").append(esc(ch.solution())).append("</code></pre>\n")
                 .append("</div>\n");
        }

        return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n"
            + "  <meta charset=\"utf-8\">\n"
            + "  <title>Java MSA Interviewer — Solutions Reference</title>\n"
            + "  <style>\n"
            + "    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n"
            + "    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #fff; color: #1a1a2e;\n"
            + "           padding: 48px; max-width: 960px; margin: 0 auto; font-size: 14px; line-height: 1.6; }\n"
            + "    .cover { text-align: center; padding: 72px 0 56px; border-bottom: 2px solid #e8eef8; margin-bottom: 48px; }\n"
            + "    .cover-tag { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: #859399; margin-bottom: 16px; }\n"
            + "    .cover h1 { font-size: 2.2rem; font-weight: 800; color: #0b1326; letter-spacing: -.02em; margin-bottom: 10px; }\n"
            + "    .cover h1 span { color: #a4e6ff; }\n"
            + "    .cover-sub { font-size: 1rem; color: #5a6a7a; margin-bottom: 28px; }\n"
            + "    .cover-meta { display: inline-flex; gap: 24px; background: #f5f7ff; border-radius: 8px;\n"
            + "                  padding: 12px 24px; font-size: .85rem; color: #4a5568; }\n"
            + "    .cover-meta strong { color: #0b1326; }\n"
            + "    .toc { margin-bottom: 48px; }\n"
            + "    .toc h3 { font-size: .8rem; letter-spacing: .08em; text-transform: uppercase; color: #859399; margin-bottom: 12px; }\n"
            + "    .toc-row { display: flex; justify-content: space-between; align-items: baseline;\n"
            + "               padding: 5px 0; border-bottom: 1px dotted #e0e0e0; font-size: .85rem; }\n"
            + "    .toc-row:last-child { border-bottom: none; }\n"
            + "    .toc-tag { font-size: .72rem; color: #859399; font-family: monospace; }\n"
            + "    .challenge { margin-bottom: 40px; }\n"
            + "    .ch-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }\n"
            + "    .badge { font-size: .7rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 2px 10px; border-radius: 4px; }\n"
            + "    .ch-id { font-size: .78rem; color: #859399; }\n"
            + "    .ch-id code { background: #f0f0f0; padding: 1px 5px; border-radius: 3px; font-size: .75rem; }\n"
            + "    h2 { font-size: 1.1rem; font-weight: 700; color: #0b1326; margin-bottom: 12px; }\n"
            + "    pre { background: #0b1326; color: #dae2fd; padding: 20px 24px; border-radius: 8px; overflow-x: auto; white-space: pre; }\n"
            + "    pre code { font-family: 'JetBrains Mono','Cascadia Code','Fira Code',Consolas,monospace; font-size: .77rem; line-height: 1.65; }\n"
            + "    @media print { body { padding: 24px; } .page-break { page-break-before: always; } pre { white-space: pre-wrap; word-break: break-word; } }\n"
            + "    @page { margin: 20mm; }\n"
            + "  </style>\n"
            + "</head>\n<body>\n\n"
            + "  <div class=\"cover\">\n"
            + "    <div class=\"cover-tag\">Internal Reference &mdash; Recruiter Use Only</div>\n"
            + "    <h1>Java MSA Interviewer<br><span>Assessment Solutions</span></h1>\n"
            + "    <div class=\"cover-sub\">Challenge Solutions Reference &middot; 6 challenges</div>\n"
            + "    <div class=\"cover-meta\">\n"
            + "      <span><strong>1</strong> Easy</span>\n"
            + "      <span><strong>3</strong> Medium</span>\n"
            + "      <span><strong>2</strong> Hard</span>\n"
            + "      <span>Generated " + LocalDate.now() + "</span>\n"
            + "    </div>\n"
            + "  </div>\n\n"
            + "  <div class=\"toc\">\n"
            + "    <h3>All Challenges</h3>\n"
            + "    <div class=\"toc-row\"><span>REST Controller Basics</span><span class=\"toc-tag\">ch1 &middot; EASY &middot; Spring MVC</span></div>\n"
            + "    <div class=\"toc-row\"><span>Service Layer Pattern</span><span class=\"toc-tag\">ch2 &middot; MEDIUM &middot; Spring Core</span></div>\n"
            + "    <div class=\"toc-row\"><span>Spring Data JPA</span><span class=\"toc-tag\">ch3 &middot; MEDIUM &middot; JPA</span></div>\n"
            + "    <div class=\"toc-row\"><span>Global Exception Handling</span><span class=\"toc-tag\">ch4 &middot; MEDIUM &middot; Spring MVC</span></div>\n"
            + "    <div class=\"toc-row\"><span>WebClient &amp; Circuit Breaker</span><span class=\"toc-tag\">ch5 &middot; HARD &middot; Microservices</span></div>\n"
            + "    <div class=\"toc-row\"><span>JWT Security Configuration</span><span class=\"toc-tag\">ch6 &middot; HARD &middot; Security</span></div>\n"
            + "  </div>\n\n"
            + cards
            + "\n  <p style=\"margin-top:56px;color:#aaa;font-size:.75rem;text-align:center\">"
            + "Java MSA Interviewer &mdash; Recruiter Reference Only &mdash; Confidential</p>\n"
            + "</body>\n</html>";
    }

    private int severityPoints(String severity) {
        return switch (severity) {
            case "low"      -> 1;
            case "medium"   -> 3;
            case "high"     -> 8;
            case "critical" -> 20;
            default         -> 0;
        };
    }
}
