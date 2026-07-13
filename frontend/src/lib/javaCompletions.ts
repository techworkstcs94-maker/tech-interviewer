import type { Monaco } from '@monaco-editor/react'
import type { editor, languages, Position } from 'monaco-editor'

// Curated Spring Boot / JPA / Security / WebClient / Kafka snippets scoped to what the 10
// challenges in this platform actually test (see README "The 6 Challenges" + DataInitializer's
// Kafka challenges 7-10). Monaco's built-in "java" language has no semantic understanding of the
// Spring classpath, so this is deliberately snippet-based rather than attempting real IntelliSense
// (which would require running a language server per candidate session).
interface Snippet {
  label: string
  detail: string
  insertText: string
}

const SNIPPETS: Snippet[] = [
  // ── Spring MVC ──────────────────────────────────────────────────────────
  {
    label: '@RestController',
    detail: 'REST controller class skeleton',
    insertText:
      '@RestController\n@RequestMapping("${1:/api/products}")\nclass ${2:ProductController} {\n\n\t${0}\n}',
  },
  {
    label: '@GetMapping',
    detail: 'GET handler returning a list',
    insertText:
      '@GetMapping\npublic List<${1:Product}> ${2:getAll}() {\n\treturn ${3:items};\n}',
  },
  {
    label: '@GetMapping (by id)',
    detail: 'GET handler with @PathVariable + 404 handling',
    insertText:
      '@GetMapping("/{id}")\npublic ${1:Product} ${2:getById}(@PathVariable Long id) {\n\treturn ${3:items}.stream()\n\t\t\t.filter(p -> p.getId().equals(id))\n\t\t\t.findFirst()\n\t\t\t.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "${1:Product} not found"));\n}',
  },
  {
    label: '@PostMapping',
    detail: 'POST handler with @RequestBody',
    insertText:
      '@PostMapping\npublic ResponseEntity<${1:Product}> ${2:create}(@RequestBody ${1:Product} ${3:body}) {\n\treturn ResponseEntity.status(HttpStatus.CREATED).body(${4:service}.create(${3:body}));\n}',
  },
  {
    label: '@PutMapping',
    detail: 'PUT handler with @PathVariable + @RequestBody',
    insertText:
      '@PutMapping("/{id}")\npublic ResponseEntity<${1:Product}> ${2:update}(@PathVariable Long id, @RequestBody ${1:Product} ${3:body}) {\n\treturn ResponseEntity.ok(${4:service}.update(id, ${3:body}));\n}',
  },
  {
    label: '@DeleteMapping',
    detail: 'DELETE handler with @PathVariable',
    insertText:
      '@DeleteMapping("/{id}")\npublic ResponseEntity<Void> ${1:delete}(@PathVariable Long id) {\n\t${2:service}.delete(id);\n\treturn ResponseEntity.noContent().build();\n}',
  },
  {
    label: 'ResponseEntity.notFound',
    detail: '404 response',
    insertText: 'ResponseEntity.notFound().build()',
  },
  {
    label: 'ResponseStatusException (404)',
    detail: 'throw a 404 with a message',
    insertText: 'throw new ResponseStatusException(HttpStatus.NOT_FOUND, "${1:not found}");',
  },

  // ── Service layer ───────────────────────────────────────────────────────
  {
    label: '@Service (constructor injection)',
    detail: 'Service implementation with final-field constructor injection',
    insertText:
      '@Service\nclass ${1:ProductServiceImpl} implements ${2:ProductService} {\n\n\tprivate final ${3:ProductRepository} ${4:repository};\n\n\t${1:ProductServiceImpl}(${3:ProductRepository} ${4:repository}) {\n\t\tthis.${4:repository} = ${4:repository};\n\t}\n\n\t${0}\n}',
  },
  {
    label: 'custom exception class',
    detail: 'RuntimeException subclass with message constructor',
    insertText:
      'class ${1:ProductValidationException} extends RuntimeException {\n\tpublic ${1:ProductValidationException}(String message) {\n\t\tsuper(message);\n\t}\n}',
  },

  // ── JPA ──────────────────────────────────────────────────────────────────
  {
    label: '@Entity',
    detail: 'JPA entity with @Id/@GeneratedValue',
    insertText:
      '@Entity\n@Table(name = "${1:products}")\nclass ${2:Product} {\n\n\t@Id\n\t@GeneratedValue(strategy = GenerationType.IDENTITY)\n\tprivate Long id;\n\n\t${0}\n}',
  },
  {
    label: 'JpaRepository',
    detail: 'Repository interface extending JpaRepository',
    insertText:
      'interface ${1:ProductRepository} extends JpaRepository<${2:Product}, Long> {\n\n\tList<${2:Product}> findBy${3:Category}(${4:String category});\n\n\t@Query("SELECT p FROM ${2:Product} p WHERE ${5:p.price <= :maxPrice}")\n\tList<${2:Product}> ${6:findByMaxPrice}(@Param("${7:maxPrice}") ${8:Double maxPrice});\n}',
  },
  {
    label: '@Query',
    detail: 'JPQL query method',
    insertText: '@Query("${1:SELECT p FROM Product p WHERE p.price <= :maxPrice}")\n${2:List<Product>} ${3:findByMaxPrice}(@Param("${4:maxPrice}") ${5:Double maxPrice});',
  },

  // ── Exception handling ──────────────────────────────────────────────────
  {
    label: '@RestControllerAdvice',
    detail: 'Global exception handler class',
    insertText:
      '@RestControllerAdvice\nclass ${1:GlobalExceptionHandler} {\n\n\t${0}\n}',
  },
  {
    label: '@ExceptionHandler',
    detail: 'Handler method returning a typed error response',
    insertText:
      '@ExceptionHandler(${1:ResourceNotFoundException}.class)\n${2:ResponseEntity<ErrorResponse>} ${3:handleNotFound}(${1:ResourceNotFoundException} ex, HttpServletRequest req) {\n\treturn build(HttpStatus.${4:NOT_FOUND}, ex.getMessage(), req, null);\n}',
  },
  {
    label: 'ErrorResponse DTO',
    detail: 'Standard error response shape',
    insertText:
      'class ${1:ErrorResponse} {\n\tprivate String timestamp;\n\tprivate int status;\n\tprivate String message;\n\tprivate String path;\n\tprivate List<String> errors;\n\n\t${0}\n}',
  },

  // ── WebClient / Resilience4j ─────────────────────────────────────────────
  {
    label: 'WebClient call',
    detail: 'GET request via WebClient with block()',
    insertText:
      'webClient.get()\n\t\t.uri("${1:/api/products}")\n\t\t.retrieve()\n\t\t.bodyToMono(${2:Product[].class})\n\t\t.block();',
  },
  {
    label: '@CircuitBreaker',
    detail: 'CircuitBreaker with fallback method pair',
    insertText:
      '@CircuitBreaker(name = "${1:productService}", fallbackMethod = "${2:fallback}")\npublic ${3:List<Product>} ${4:getProducts}() {\n\t${0}\n}\n\n${3:List<Product>} ${2:fallback}(Throwable t) {\n\treturn ${5:List.of()};\n}',
  },

  // ── Security / JWT ───────────────────────────────────────────────────────
  {
    label: 'SecurityFilterChain',
    detail: '@Bean returning a configured SecurityFilterChain',
    insertText:
      '@Bean\nSecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n\thttp\n\t\t.csrf(csrf -> csrf.disable())\n\t\t.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))\n\t\t.authorizeHttpRequests(auth -> auth\n\t\t\t.requestMatchers("/auth/**").permitAll()\n\t\t\t.anyRequest().authenticated())\n\t\t.addFilterBefore(${1:jwtAuthFilter}, UsernamePasswordAuthenticationFilter.class);\n\treturn http.build();\n}',
  },
  {
    label: 'OncePerRequestFilter',
    detail: 'JWT auth filter skeleton',
    insertText:
      'class ${1:JwtAuthFilter} extends OncePerRequestFilter {\n\n\t@Override\n\tprotected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)\n\t\t\tthrows ServletException, IOException {\n\t\t${0}\n\t\tchain.doFilter(req, res);\n\t}\n}',
  },
  {
    label: 'Jwts.builder',
    detail: 'Generate a signed JWT',
    insertText:
      'Jwts.builder()\n\t\t.subject(${1:username})\n\t\t.issuedAt(new Date())\n\t\t.expiration(new Date(System.currentTimeMillis() + ${2:expiryMs}))\n\t\t.signWith(${3:key})\n\t\t.compact();',
  },

  // ── Kafka ────────────────────────────────────────────────────────────────
  {
    label: '@KafkaListener',
    detail: 'Consumer method with manual acknowledgment',
    insertText:
      '@KafkaListener(topics = {"${1:orders}"}, groupId = "${2:order-processors}")\npublic void ${3:processOrder}(ConsumerRecord<String, String> record, Acknowledgment ack) {\n\t${0}\n\tack.acknowledge();\n}',
  },
  {
    label: 'kafkaTemplate.send',
    detail: 'Publish a keyed event',
    insertText: 'kafkaTemplate.send("${1:orders}", ${2:orderId}, ${3:payload});',
  },
  {
    label: '@RetryableTopic + @DltHandler',
    detail: 'Retry with exponential backoff, then dead-letter',
    insertText:
      '@RetryableTopic(\n\t\tattempts = "${1:3}",\n\t\tbackoff = @Backoff(delay = ${2:1000}, multiplier = ${3:2.0}))\n@KafkaListener(topics = "${4:payments}", groupId = "${5:payment-processors}")\npublic void ${6:processPayment}(String payload) {\n\t${0}\n}\n\n@DltHandler\npublic void handleDlt(String payload) {\n\t// payload landed in the dead-letter topic after all retries were exhausted\n}',
  },
  {
    label: '@Transactional (Kafka producer)',
    detail: 'DB write + Kafka publish in one transaction',
    insertText:
      '@Transactional\npublic void ${1:processOrder}(${2:Order order}) {\n\t${3:repository}.save(${2:order});\n\t${4:kafkaTemplate}.send("${5:order-events}", ${2:order}.getId().toString(), ${2:order}.toString());\n}',
  },
  {
    label: 'ProducerFactory + KafkaTemplate @Bean',
    detail: 'Transactional producer configuration',
    insertText:
      '@Bean\npublic ProducerFactory<String, String> producerFactory() {\n\tMap<String, Object> props = Map.of(\n\t\t\t"bootstrap.servers", "${1:localhost:9092}",\n\t\t\t"key.serializer", "org.apache.kafka.common.serialization.StringSerializer",\n\t\t\t"value.serializer", "org.apache.kafka.common.serialization.StringSerializer");\n\tDefaultKafkaProducerFactory<String, String> factory = new DefaultKafkaProducerFactory<>(props);\n\tfactory.setTransactionIdPrefix("${2:order-tx-}");\n\treturn factory;\n}\n\n@Bean\npublic KafkaTemplate<String, String> kafkaTemplate(ProducerFactory<String, String> pf) {\n\treturn new KafkaTemplate<>(pf);\n}',
  },
]

let registered = false

// Monaco's completion registry is global (not per-editor-instance), so calling this more than
// once — e.g. on every CodeEditor remount — would duplicate every entry in the suggestion list.
export function registerJavaCompletions(monaco: Monaco) {
  if (registered) return
  registered = true

  monaco.languages.registerCompletionItemProvider('java', {
    provideCompletionItems(model: editor.ITextModel, position: Position) {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      const suggestions: languages.CompletionItem[] = SNIPPETS.map((s) => ({
        label: s.label,
        kind: monaco.languages.CompletionItemKind.Snippet,
        detail: s.detail,
        insertText: s.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      }))

      return { suggestions }
    },
  })
}
