-- Bug-fixing challenges (IDs pinned to 11-13 so they line up with:
--   * CodeAnalysisService switch cases 11/12/13
--   * GitHubActionsService.JUNIT_ENABLED_CHALLENGES
--   * challenge-tests/challenge-11|12|13 JUnit harnesses
-- Starter code is intentionally BUGGY; the candidate must fix it. JUnit is the authority.
INSERT INTO challenges (id, title, description, difficulty, category, time_limit_seconds, starter_code, test_cases_json, hints_json, concepts_json, active) VALUES
(
  11,
  'Fix the Product Controller',
  'This ProductController has a bug. GET /api/products/{id} returns HTTP 200 with an empty body when the product does not exist — it should return 404 Not Found instead.

▸ Keep the list endpoint working (GET /api/products → 200 with all products)
▸ Fix GET /api/products/{id} so a missing product yields 404, an existing one yields 200
▸ Do not change the Product model or the sample data

Only fix the bug — the structure is already in place.',
  'MEDIUM',
  'Bug Fix',
  600,
  '@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final List<Product> products = new ArrayList<>(List.of(
        new Product(1L, "Mechanical Keyboard", 89.99, "Peripherals"),
        new Product(2L, "27\" Monitor", 199.50, "Displays")
    ));

    @GetMapping
    public List<Product> all() {
        return products;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> byId(@PathVariable Long id) {
        Product found = null;
        for (Product p : products) {
            if (p.getId().equals(id)) {
                found = p;
            }
        }
        // BUG: returns 200 OK even when the product was not found — should be 404
        return ResponseEntity.ok(found);
    }
}

class Product {
    private Long id;
    private String name;
    private Double price;
    private String category;

    public Product() {}
    public Product(Long id, String name, Double price, String category) {
        this.id = id; this.name = name; this.price = price; this.category = category;
    }
    public Long getId() { return id; }
    public String getName() { return name; }
    public Double getPrice() { return price; }
    public String getCategory() { return category; }
}',
  '[{"id":"t1","label":"@RestController present","weight":20},{"id":"t2","label":"@GetMapping list endpoint intact","weight":20},{"id":"t3","label":"@PathVariable for id","weight":20},{"id":"t4","label":"404 returned for missing product","weight":20},{"id":"t5","label":"Product model fields intact","weight":20}]',
  '[{"id":"h1","text":"The bug is in byId(): it always returns ResponseEntity.ok(...) regardless of whether the product was found"},{"id":"h2","text":"When found is null, return ResponseEntity.notFound().build() instead of ResponseEntity.ok(found)"},{"id":"h3","text":"An existing id (1 or 2) must still return 200 with the product body"}]',
  '["Bug Fix","@RestController","ResponseEntity","404 Handling","Spring MVC"]',
  TRUE
),
(
  12,
  'Fix the Global Exception Handler',
  'The @RestControllerAdvice below maps ResourceNotFoundException to the wrong HTTP status. When an item is missing, the API returns 500 Internal Server Error — it should return 404 Not Found.

▸ GET /api/items/{id} throws ResourceNotFoundException for id > 100
▸ Fix the exception handler so that case returns 404 (not 500)
▸ Keep the ErrorResponse body (status + message) intact

Only fix the bug — the handler wiring is already correct.',
  'MEDIUM',
  'Bug Fix',
  600,
  '@RestController
@RequestMapping("/api/items")
class ItemController {

    @GetMapping("/{id}")
    public String getItem(@PathVariable Long id) {
        if (id > 100) {
            throw new ResourceNotFoundException("Item " + id + " not found");
        }
        return "item-" + id;
    }
}

@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        // BUG: a missing resource is not a server error — this should be 404, not 500
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(500, ex.getMessage()));
    }
}

class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) { super(message); }
}

class ErrorResponse {
    private int status;
    private String message;
    public ErrorResponse(int status, String message) { this.status = status; this.message = message; }
    public int getStatus() { return status; }
    public String getMessage() { return message; }
}',
  '[{"id":"t1","label":"@RestControllerAdvice present","weight":25},{"id":"t2","label":"@ExceptionHandler(ResourceNotFoundException)","weight":25},{"id":"t3","label":"Handler returns 404 (not 500)","weight":30},{"id":"t4","label":"ErrorResponse body with message","weight":20}]',
  '[{"id":"h1","text":"The handler uses HttpStatus.INTERNAL_SERVER_ERROR — a not-found condition should map to HttpStatus.NOT_FOUND"},{"id":"h2","text":"Change both the ResponseEntity status and the ErrorResponse status code to 404"},{"id":"h3","text":"GET /api/items/5 must still return 200; GET /api/items/999 must return 404 with the message"}]',
  '["Bug Fix","@RestControllerAdvice","@ExceptionHandler","HTTP Status Codes","Error Handling"]',
  TRUE
),
(
  13,
  'Fix the Service Validation',
  'ProductService has inverted validation logic: it rejects VALID input and accepts invalid input. A product with a positive price and a non-blank name should be created (201); a non-positive price or a blank name should be rejected (400).

▸ POST /api/products creates a product via ProductService.create(...)
▸ Fix the validation so valid products succeed and invalid ones throw ProductValidationException
▸ Keep the exception → 400 mapping intact

Only fix the validation conditions — everything else is wired correctly.',
  'MEDIUM',
  'Bug Fix',
  720,
  '@Service
class ProductService {

    public Product create(Product p) {
        // BUG: these conditions are inverted — valid input is rejected, invalid input passes
        if (p.getPrice() != null && p.getPrice() > 0) {
            throw new ProductValidationException("Price must be greater than 0");
        }
        if (p.getName() != null && !p.getName().isBlank()) {
            throw new ProductValidationException("Name must not be blank");
        }
        return p;
    }
}

@RestController
@RequestMapping("/api/products")
class ProductController {

    private final ProductService service;
    ProductController(ProductService service) { this.service = service; }

    @PostMapping
    public ResponseEntity<Product> create(@RequestBody Product p) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(p));
    }

    @ExceptionHandler(ProductValidationException.class)
    public ResponseEntity<String> handleValidation(ProductValidationException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}

class ProductValidationException extends RuntimeException {
    public ProductValidationException(String message) { super(message); }
}

class Product {
    private String name;
    private Double price;
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
}',
  '[{"id":"t1","label":"@Service on ProductService","weight":20},{"id":"t2","label":"Rejects price <= 0","weight":30},{"id":"t3","label":"Rejects blank name","weight":25},{"id":"t4","label":"Throws ProductValidationException","weight":25}]',
  '[{"id":"h1","text":"The price check throws when price > 0 — it should throw when price <= 0"},{"id":"h2","text":"The name check throws when the name is NOT blank — it should throw when the name IS blank (isBlank())"},{"id":"h3","text":"After fixing: {\"name\":\"Widget\",\"price\":10} → 201; {\"price\":-5} or {\"name\":\"\"} → 400"}]',
  '["Bug Fix","Input Validation","@Service","Custom Exception","Spring Core"]',
  TRUE
);

-- Keep the identity sequence ahead of the pinned ids so future auto-generated inserts don't collide.
SELECT setval(pg_get_serial_sequence('challenges', 'id'), (SELECT MAX(id) FROM challenges));
