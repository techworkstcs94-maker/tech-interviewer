package com.assessment.service;

import com.assessment.dto.AnalysisResult;
import com.assessment.dto.AnalysisResult.TestResult;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.FieldDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.Parameter;
import com.github.javaparser.ast.stmt.ThrowStmt;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class CodeAnalysisService {

    public AnalysisResult analyze(Long challengeId, String code) {
        try {
            CompilationUnit cu = StaticJavaParser.parse(code);
            List<TestResult> results;
            List<Integer> weights;

            switch (challengeId.intValue()) {
                case 1 -> {
                    results = analyzeChallenge1(cu, code);
                    weights = List.of(20, 20, 20, 20, 20);
                }
                case 2 -> {
                    results = analyzeChallenge2(cu, code);
                    weights = List.of(17, 17, 17, 17, 16, 16);
                }
                case 3 -> {
                    results = analyzeChallenge3(cu, code);
                    weights = List.of(17, 17, 17, 17, 16, 16);
                }
                case 4 -> {
                    results = analyzeChallenge4(cu, code);
                    weights = List.of(20, 20, 20, 20, 20);
                }
                case 5 -> {
                    results = analyzeChallenge5(cu, code);
                    weights = List.of(17, 17, 17, 17, 16, 16);
                }
                case 6 -> {
                    results = analyzeChallenge6(cu, code);
                    weights = List.of(15, 14, 14, 14, 14, 15, 14);
                }
                default -> {
                    return new AnalysisResult(List.of(), 0, 0, "Unknown challenge: " + challengeId);
                }
            }

            int instantScore = computeScore(results, weights);
            int qualityScore = computeQualityScore(cu, code);
            return new AnalysisResult(results, instantScore, qualityScore, null);

        } catch (Exception e) {
            log.warn("Parse error for challenge {}: {}", challengeId, e.getMessage());
            List<TestResult> failed = getFailedResults(challengeId);
            return new AnalysisResult(failed, 0, 0, "Parse error: " + e.getMessage());
        }
    }

    // ── Challenge 1: REST Controller ────────────────────────────────────────────

    private List<TestResult> analyzeChallenge1(CompilationUnit cu, String code) {
        List<TestResult> results = new ArrayList<>();

        boolean t1 = cu.findAll(ClassOrInterfaceDeclaration.class).stream()
                .anyMatch(c -> hasAnnotation(c, "RestController"));
        results.add(tr("t1", "@RestController annotation present", t1,
                t1 ? "Found @RestController" : "Missing @RestController on controller class"));

        boolean t2 = cu.findAll(MethodDeclaration.class).stream()
                .anyMatch(m -> hasAnnotation(m, "GetMapping")
                        && (m.getTypeAsString().contains("List")
                            || m.getTypeAsString().contains("ResponseEntity")));
        results.add(tr("t2", "@GetMapping for list endpoint", t2,
                t2 ? "Found GET mapping for list" : "Missing @GetMapping method returning List or ResponseEntity<List>"));

        boolean t3 = cu.findAll(MethodDeclaration.class).stream()
                .anyMatch(m -> m.getParameters().stream().anyMatch(p -> hasAnnotation(p, "PathVariable")));
        results.add(tr("t3", "@PathVariable for ID parameter", t3,
                t3 ? "Found @PathVariable" : "Missing @PathVariable in method parameter"));

        boolean t4 = cu.findAll(MethodDeclaration.class).stream()
                .anyMatch(m ->
                        // ResponseEntity.notFound() / NOT_FOUND / 404 in return
                        (m.getTypeAsString().contains("ResponseEntity")
                                && (m.toString().contains("notFound") || m.toString().contains("NOT_FOUND")
                                    || m.toString().contains("404")))
                        // ResponseStatusException with NOT_FOUND (valid alternative)
                        || (m.toString().contains("ResponseStatusException")
                                && (m.toString().contains("NOT_FOUND") || m.toString().contains("404")))
                );
        results.add(tr("t4", "404 handling present", t4,
                t4 ? "Found 404 handling" : "Missing 404 response — use ResponseEntity.notFound() or throw ResponseStatusException(HttpStatus.NOT_FOUND)"));

        boolean t5 = cu.findAll(ClassOrInterfaceDeclaration.class).stream()
                .anyMatch(c -> c.getNameAsString().contains("Product")
                        && hasField(c, "id") && hasField(c, "name")
                        && hasField(c, "price") && hasField(c, "category"));
        results.add(tr("t5", "Product model with required fields", t5,
                t5 ? "Product has all required fields" : "Product missing id/name/price/category fields"));

        return results;
    }

    // ── Challenge 2: Service Layer ───────────────────────────────────────────────

    private List<TestResult> analyzeChallenge2(CompilationUnit cu, String code) {
        List<TestResult> results = new ArrayList<>();

        boolean t1 = cu.findAll(ClassOrInterfaceDeclaration.class).stream()
                .anyMatch(c -> hasAnnotation(c, "Service"));
        results.add(tr("t1", "@Service on implementation class", t1,
                t1 ? "Found @Service" : "Missing @Service annotation"));

        boolean t2 = cu.findAll(ClassOrInterfaceDeclaration.class).stream()
                .filter(c -> hasAnnotation(c, "Service"))
                .anyMatch(c -> !c.getImplementedTypes().isEmpty());
        results.add(tr("t2", "Implements service interface", t2,
                t2 ? "Service implements interface" : "@Service class does not implement an interface"));

        boolean t3 = cu.findAll(ClassOrInterfaceDeclaration.class).stream()
                .anyMatch(c -> c.getFields().stream().anyMatch(FieldDeclaration::isFinal)
                        && !c.getConstructors().isEmpty()
                        && c.getFields().stream().noneMatch(f -> hasAnnotation(f, "Autowired")));
        results.add(tr("t3", "Constructor injection (no @Autowired field)", t3,
                t3 ? "Using constructor injection" : "Use final fields + constructor, not @Autowired fields"));

        boolean t4 = (code.contains("price") && (code.contains("<= 0") || code.contains("< 0")
                || code.contains("price > 0")))
                || (code.contains("price") && code.contains("throw"));
        results.add(tr("t4", "Price > 0 validation", t4,
                t4 ? "Found price validation" : "Missing price > 0 check with exception throw"));

        boolean t5 = code.contains("name") && (code.contains("isBlank") || code.contains("isEmpty")
                || code.contains("hasText") || (code.contains("blank") && code.contains("throw")));
        results.add(tr("t5", "Non-blank name validation", t5,
                t5 ? "Found name validation" : "Missing name.isBlank() check with exception throw"));

        boolean t6 = cu.findAll(ThrowStmt.class).stream()
                .anyMatch(t -> !t.getExpression().toString().contains("new RuntimeException")
                        && !t.getExpression().toString().contains("new IllegalArgumentException")
                        && t.getExpression().toString().startsWith("new "));
        if (!t6) {
            t6 = cu.findAll(ClassOrInterfaceDeclaration.class).stream()
                    .anyMatch(c -> c.getNameAsString().endsWith("Exception")
                            && !c.getNameAsString().equals("RuntimeException")
                            && !c.getNameAsString().equals("IllegalArgumentException"));
        }
        results.add(tr("t6", "Custom exception thrown", t6,
                t6 ? "Found custom exception" : "Create a custom exception class (not RuntimeException)"));

        return results;
    }

    // ── Challenge 3: Spring Data JPA ────────────────────────────────────────────

    private List<TestResult> analyzeChallenge3(CompilationUnit cu, String code) {
        List<TestResult> results = new ArrayList<>();

        boolean t1 = cu.findAll(ClassOrInterfaceDeclaration.class).stream()
                .anyMatch(c -> hasAnnotation(c, "Entity"));
        results.add(tr("t1", "@Entity on Product class", t1,
                t1 ? "Found @Entity" : "Missing @Entity annotation"));

        boolean t2 = cu.findAll(FieldDeclaration.class).stream()
                .anyMatch(f -> hasAnnotation(f, "Id") && hasAnnotation(f, "GeneratedValue"));
        results.add(tr("t2", "@Id and @GeneratedValue present", t2,
                t2 ? "Found @Id and @GeneratedValue" : "Primary key field needs @Id and @GeneratedValue"));

        boolean t3 = cu.findAll(ClassOrInterfaceDeclaration.class).stream()
                .filter(ClassOrInterfaceDeclaration::isInterface)
                .anyMatch(c -> c.getExtendedTypes().stream()
                        .anyMatch(t -> t.getNameAsString().contains("JpaRepository")
                                || t.getNameAsString().contains("CrudRepository")));
        results.add(tr("t3", "Extends JpaRepository", t3,
                t3 ? "Repository extends JpaRepository" : "Repository must extend JpaRepository<Entity, Id>"));

        boolean t4 = cu.findAll(MethodDeclaration.class).stream()
                .anyMatch(m -> m.getNameAsString().startsWith("findByCategory"));
        results.add(tr("t4", "findByCategory derived query", t4,
                t4 ? "Found findByCategory" : "Missing findByCategory(String) derived query method"));

        boolean t5 = cu.findAll(MethodDeclaration.class).stream()
                .anyMatch(m -> hasAnnotation(m, "Query"));
        results.add(tr("t5", "@Query for price filter", t5,
                t5 ? "Found @Query" : "Missing @Query annotation for custom price filter"));

        String lc = code.toLowerCase();
        boolean t6 = lc.contains("h2") || lc.contains("datasource") || lc.contains("jdbc")
                || lc.contains("spring.datasource");
        results.add(tr("t6", "H2/datasource configured", t6,
                t6 ? "Found datasource config" : "Include H2/datasource config in application.properties"));

        return results;
    }

    // ── Challenge 4: Exception Handling ─────────────────────────────────────────

    private List<TestResult> analyzeChallenge4(CompilationUnit cu, String code) {
        List<TestResult> results = new ArrayList<>();

        boolean t1 = cu.findAll(ClassOrInterfaceDeclaration.class).stream()
                .anyMatch(c -> hasAnnotation(c, "ControllerAdvice") || hasAnnotation(c, "RestControllerAdvice"));
        results.add(tr("t1", "@ControllerAdvice present", t1,
                t1 ? "Found @ControllerAdvice" : "Missing @ControllerAdvice or @RestControllerAdvice"));

        boolean t2 = cu.findAll(MethodDeclaration.class).stream()
                .anyMatch(m -> hasAnnotation(m, "ExceptionHandler")
                        && m.toString().contains("ResourceNotFoundException")
                        && (m.toString().contains("404") || m.toString().contains("NOT_FOUND")));
        results.add(tr("t2", "ResourceNotFoundException → 404", t2,
                t2 ? "Found 404 handler" : "Missing @ExceptionHandler(ResourceNotFoundException) returning 404"));

        boolean t3 = cu.findAll(MethodDeclaration.class).stream()
                .anyMatch(m -> hasAnnotation(m, "ExceptionHandler")
                        && m.toString().contains("MethodArgumentNotValidException"));
        results.add(tr("t3", "MethodArgumentNotValidException → 400", t3,
                t3 ? "Found 400 handler" : "Missing @ExceptionHandler(MethodArgumentNotValidException)"));

        boolean t4 = cu.findAll(MethodDeclaration.class).stream()
                .anyMatch(m -> hasAnnotation(m, "ExceptionHandler")
                        && (m.getAnnotations().stream()
                                .anyMatch(a -> a.toString().contains("Exception.class"))
                            || m.getParameters().stream()
                                .anyMatch(p -> p.getTypeAsString().equals("Exception"))));
        results.add(tr("t4", "Generic Exception → 500", t4,
                t4 ? "Found generic exception handler" : "Missing @ExceptionHandler(Exception.class) for 500"));

        boolean t5 = cu.findAll(ClassOrInterfaceDeclaration.class).stream()
                .anyMatch(c -> c.getNameAsString().contains("ErrorResponse")
                        && (c.toString().contains("timestamp") || c.toString().contains("status")
                            || c.toString().contains("message")));
        results.add(tr("t5", "ErrorResponse DTO returned", t5,
                t5 ? "Found ErrorResponse class" : "Missing ErrorResponse DTO with timestamp/status/message/path"));

        return results;
    }

    // ── Challenge 5: WebClient + Circuit Breaker ─────────────────────────────────

    private List<TestResult> analyzeChallenge5(CompilationUnit cu, String code) {
        List<TestResult> results = new ArrayList<>();

        boolean t1 = cu.findAll(FieldDeclaration.class).stream()
                .anyMatch(f -> f.getVariables().stream()
                        .anyMatch(v -> v.getTypeAsString().contains("WebClient")))
                || code.contains("WebClient");
        results.add(tr("t1", "WebClient configured", t1,
                t1 ? "Found WebClient" : "Missing WebClient field or bean configuration"));

        boolean t2 = code.contains(".get(") || code.contains(".retrieve(")
                || code.contains("webClient.get") || code.contains(".exchange(");
        results.add(tr("t2", "HTTP call implemented", t2,
                t2 ? "Found WebClient HTTP call" : "Missing WebClient call (.get().retrieve())"));

        boolean t3 = cu.findAll(MethodDeclaration.class).stream()
                .anyMatch(m -> hasAnnotation(m, "CircuitBreaker"));
        results.add(tr("t3", "@CircuitBreaker annotation", t3,
                t3 ? "Found @CircuitBreaker" : "Missing @CircuitBreaker (from resilience4j)"));

        boolean t4 = cu.findAll(MethodDeclaration.class).stream()
                .anyMatch(m -> hasAnnotation(m, "CircuitBreaker")
                        && m.toString().contains("fallbackMethod"))
                && cu.findAll(MethodDeclaration.class).size() > 1;
        results.add(tr("t4", "Fallback method present", t4,
                t4 ? "Found fallback method" : "Missing fallbackMethod attribute in @CircuitBreaker or the fallback method"));

        boolean t5 = code.contains("timeout") || code.contains("Timeout")
                || code.contains("connectTimeout") || code.contains("readTimeout")
                || code.contains("Duration.");
        results.add(tr("t5", "Timeout configuration", t5,
                t5 ? "Found timeout config" : "Missing timeout configuration (connectTimeout/readTimeout)"));

        boolean t6 = code.contains("onStatus") || code.contains("4xx") || code.contains("5xx")
                || code.contains("WebClientResponseException") || code.contains("onErrorReturn")
                || code.contains("onErrorResume");
        results.add(tr("t6", "Error handling for 4xx/5xx", t6,
                t6 ? "Found error handling" : "Missing 4xx/5xx error handling (onStatus, WebClientResponseException)"));

        return results;
    }

    // ── Challenge 6: JWT Security ────────────────────────────────────────────────

    private List<TestResult> analyzeChallenge6(CompilationUnit cu, String code) {
        List<TestResult> results = new ArrayList<>();

        boolean t1 = cu.findAll(MethodDeclaration.class).stream()
                .anyMatch(m -> hasAnnotation(m, "Bean")
                        && m.getTypeAsString().contains("SecurityFilterChain"));
        results.add(tr("t1", "SecurityFilterChain bean", t1,
                t1 ? "Found SecurityFilterChain @Bean" : "Missing @Bean method returning SecurityFilterChain"));

        boolean t2 = code.contains("csrf") && (code.contains("disable") || code.contains(".disable()"));
        results.add(tr("t2", "CSRF disabled", t2,
                t2 ? "CSRF is disabled" : "Missing csrf(csrf -> csrf.disable())"));

        boolean t3 = code.contains("requestMatchers") && code.contains("auth") && code.contains("permitAll");
        results.add(tr("t3", "/auth/** permitted", t3,
                t3 ? "Found permitAll for auth" : "Missing requestMatchers(\"/auth/**\").permitAll()"));

        boolean t4 = code.contains("STATELESS") || code.contains("SessionCreationPolicy");
        results.add(tr("t4", "Stateless session policy", t4,
                t4 ? "Session is STATELESS" : "Missing SessionCreationPolicy.STATELESS"));

        boolean t5 = cu.findAll(ClassOrInterfaceDeclaration.class).stream()
                .anyMatch(c -> c.getExtendedTypes().stream()
                        .anyMatch(t -> t.getNameAsString().equals("OncePerRequestFilter"))
                        && c.getMethods().stream()
                                .anyMatch(m -> m.getNameAsString().equals("doFilterInternal")));
        results.add(tr("t5", "JwtAuthenticationFilter extends OncePerRequestFilter", t5,
                t5 ? "Found OncePerRequestFilter with doFilterInternal" : "Class must extend OncePerRequestFilter and implement doFilterInternal"));

        boolean t6 = code.contains("Jwts.builder") || code.contains("Claims")
                || code.contains("setSubject") || code.contains("signWith")
                || code.contains("generateToken");
        results.add(tr("t6", "JWT generation with claims", t6,
                t6 ? "Found JWT generation" : "Missing JWT generation (Jwts.builder().setSubject().signWith())"));

        boolean t7 = cu.findAll(MethodDeclaration.class).stream()
                .anyMatch(m -> hasAnnotation(m, "PostMapping")
                        && (m.getAnnotations().stream().anyMatch(a -> a.toString().contains("login"))
                            || m.getNameAsString().toLowerCase().contains("login"))
                        && (m.toString().contains("token") || m.toString().contains("jwt")
                            || m.toString().contains("JWT")));
        results.add(tr("t7", "Login endpoint returns token", t7,
                t7 ? "Found login endpoint returning token" : "Missing @PostMapping login endpoint that returns JWT"));

        return results;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private int computeScore(List<TestResult> results, List<Integer> weights) {
        int score = 0;
        for (int i = 0; i < results.size() && i < weights.size(); i++) {
            if (results.get(i).isPassed()) {
                score += weights.get(i);
            }
        }
        return Math.min(100, score);
    }

    private int computeQualityScore(CompilationUnit cu, String code) {
        int quality = 0;

        boolean hasConstructorInjection = cu.findAll(ClassOrInterfaceDeclaration.class).stream()
                .anyMatch(c -> c.getFields().stream().anyMatch(FieldDeclaration::isFinal)
                        && !c.getConstructors().isEmpty()
                        && c.getFields().stream().noneMatch(f -> hasAnnotation(f, "Autowired")));
        if (hasConstructorInjection) quality += 10;

        if (code.contains("Optional")) quality += 5;

        boolean hasCustomException = cu.findAll(ClassOrInterfaceDeclaration.class).stream()
                .anyMatch(c -> c.getNameAsString().endsWith("Exception")
                        && !c.getNameAsString().equals("RuntimeException")
                        && !c.getNameAsString().equals("IllegalArgumentException"));
        if (hasCustomException) quality += 10;

        if (code.contains("List<") || code.contains("Optional<") || code.contains("Map<")) quality += 5;

        boolean hasFieldInjection = cu.findAll(FieldDeclaration.class).stream()
                .anyMatch(f -> hasAnnotation(f, "Autowired"));
        if (hasFieldInjection) quality -= 10;

        if (code.contains("return null")) quality -= 10;

        return quality;
    }

    private boolean hasAnnotation(ClassOrInterfaceDeclaration node, String name) {
        return node.getAnnotations().stream().anyMatch(a -> a.getNameAsString().equals(name));
    }

    private boolean hasAnnotation(MethodDeclaration node, String name) {
        return node.getAnnotations().stream().anyMatch(a -> a.getNameAsString().equals(name));
    }

    private boolean hasAnnotation(FieldDeclaration node, String name) {
        return node.getAnnotations().stream().anyMatch(a -> a.getNameAsString().equals(name));
    }

    private boolean hasAnnotation(Parameter node, String name) {
        return node.getAnnotations().stream().anyMatch(a -> a.getNameAsString().equals(name));
    }

    private boolean hasField(ClassOrInterfaceDeclaration c, String fieldName) {
        return c.getFields().stream()
                .anyMatch(f -> f.getVariables().stream()
                        .anyMatch(v -> v.getNameAsString().equals(fieldName)));
    }

    private TestResult tr(String id, String label, boolean passed, String feedback) {
        return new TestResult(id, label, passed, feedback);
    }

    private List<TestResult> getFailedResults(Long challengeId) {
        return switch (challengeId.intValue()) {
            case 1 -> List.of(
                tr("t1", "@RestController annotation present", false, "Parse error"),
                tr("t2", "@GetMapping for list endpoint", false, "Parse error"),
                tr("t3", "@PathVariable for ID parameter", false, "Parse error"),
                tr("t4", "ResponseEntity used for 404", false, "Parse error"),
                tr("t5", "Product model with required fields", false, "Parse error")
            );
            case 2 -> List.of(
                tr("t1", "@Service on implementation class", false, "Parse error"),
                tr("t2", "Implements service interface", false, "Parse error"),
                tr("t3", "Constructor injection (no @Autowired field)", false, "Parse error"),
                tr("t4", "Price > 0 validation", false, "Parse error"),
                tr("t5", "Non-blank name validation", false, "Parse error"),
                tr("t6", "Custom exception thrown", false, "Parse error")
            );
            case 3 -> List.of(
                tr("t1", "@Entity on Product class", false, "Parse error"),
                tr("t2", "@Id and @GeneratedValue present", false, "Parse error"),
                tr("t3", "Extends JpaRepository", false, "Parse error"),
                tr("t4", "findByCategory derived query", false, "Parse error"),
                tr("t5", "@Query for price filter", false, "Parse error"),
                tr("t6", "H2/datasource configured", false, "Parse error")
            );
            case 4 -> List.of(
                tr("t1", "@ControllerAdvice present", false, "Parse error"),
                tr("t2", "ResourceNotFoundException → 404", false, "Parse error"),
                tr("t3", "MethodArgumentNotValidException → 400", false, "Parse error"),
                tr("t4", "Generic Exception → 500", false, "Parse error"),
                tr("t5", "ErrorResponse DTO returned", false, "Parse error")
            );
            case 5 -> List.of(
                tr("t1", "WebClient configured", false, "Parse error"),
                tr("t2", "HTTP call implemented", false, "Parse error"),
                tr("t3", "@CircuitBreaker annotation", false, "Parse error"),
                tr("t4", "Fallback method present", false, "Parse error"),
                tr("t5", "Timeout configuration", false, "Parse error"),
                tr("t6", "Error handling for 4xx/5xx", false, "Parse error")
            );
            case 6 -> List.of(
                tr("t1", "SecurityFilterChain bean", false, "Parse error"),
                tr("t2", "CSRF disabled", false, "Parse error"),
                tr("t3", "/auth/** permitted", false, "Parse error"),
                tr("t4", "Stateless session policy", false, "Parse error"),
                tr("t5", "JwtAuthenticationFilter extends OncePerRequestFilter", false, "Parse error"),
                tr("t6", "JWT generation with claims", false, "Parse error"),
                tr("t7", "Login endpoint returns token", false, "Parse error")
            );
            default -> List.of();
        };
    }
}
