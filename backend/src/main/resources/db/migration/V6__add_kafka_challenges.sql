INSERT INTO challenges (title, description, difficulty, category, time_limit_seconds, starter_code, test_cases_json, hints_json, concepts_json) VALUES
(
  'Kafka Producer Basics',
  'Implement a Kafka producer service that publishes order events using KafkaTemplate.

▸ Annotate the class as a Spring @Service
▸ Inject KafkaTemplate<String, String> via constructor injection (final field, no @Autowired)
▸ Implement sendOrderEvent(String orderId, String payload) that sends to the "orders" topic
▸ Use orderId as the message key so related events land on the same partition

Concept check: KafkaTemplate.send(topic, key, value) routes messages with the same key to the same partition, enabling ordered processing per entity.',
  'EASY',
  'Kafka',
  600,
  'import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

// TODO: Annotate as @Service
// TODO: Inject KafkaTemplate<String, String> via constructor injection
// TODO: Implement sendOrderEvent(String orderId, String payload)
//       Send to topic "orders" using orderId as the message key

public class OrderEventProducer {
    // TODO: Declare KafkaTemplate field (final)

    // TODO: Implement sendOrderEvent
}',
  '[{"id":"t1","label":"@Service annotation present","weight":20},{"id":"t2","label":"KafkaTemplate field declared","weight":20},{"id":"t3","label":"Constructor injection used","weight":20},{"id":"t4","label":"kafkaTemplate.send() called","weight":20},{"id":"t5","label":"\"orders\" topic referenced","weight":20}]',
  '[{"id":"h1","text":"Annotate the class with @Service so Spring manages the bean lifecycle"},{"id":"h2","text":"Declare private final KafkaTemplate<String, String> kafkaTemplate and create a constructor"},{"id":"h3","text":"Use kafkaTemplate.send(\"orders\", orderId, payload) — key ensures partition affinity"},{"id":"h4","text":"The key parameter routes all events with the same orderId to the same partition, preserving order"}]',
  '["KafkaTemplate","Producer","Topic","Partition Key","Constructor Injection","Event-Driven"]'
),
(
  'Kafka Consumer Groups',
  'Implement a Kafka consumer that processes order events using @KafkaListener.

▸ Annotate the class as a Spring @Component
▸ Create a method processOrder(ConsumerRecord<String, String> record) annotated with @KafkaListener
▸ Set topics = {"orders"} and groupId = "order-processors" on the listener
▸ Log the record key (orderId) and value (payload)
▸ Call acknowledgment.acknowledge() to commit the offset manually

Concept check: Consumer group ID determines which consumers share the workload. Each partition is assigned to exactly one consumer in a group — scaling consumers beyond partition count gives no throughput gain.',
  'MEDIUM',
  'Kafka',
  900,
  'import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

// TODO: Annotate as @Component and add @Slf4j
// TODO: Implement processOrder(ConsumerRecord<String, String> record, Acknowledgment ack)
// TODO: Add @KafkaListener(topics = {"orders"}, groupId = "order-processors")
// TODO: Log record.key() and record.value()
// TODO: Call ack.acknowledge() to commit the offset

public class OrderEventConsumer {
    // TODO: Implement processOrder
}',
  '[{"id":"t1","label":"@Component annotation present","weight":20},{"id":"t2","label":"@KafkaListener annotation used","weight":20},{"id":"t3","label":"groupId = \"order-processors\" set","weight":20},{"id":"t4","label":"ConsumerRecord parameter used","weight":20},{"id":"t5","label":"acknowledge() called for manual commit","weight":20}]',
  '[{"id":"h1","text":"Use @Component on the class; @KafkaListener goes on the method"},{"id":"h2","text":"@KafkaListener(topics = {\"orders\"}, groupId = \"order-processors\") wires the method to the topic"},{"id":"h3","text":"Add Acknowledgment ack as a second method parameter to enable manual offset commit"},{"id":"h4","text":"Always call ack.acknowledge() after successful processing to advance the offset — skipping this causes reprocessing on restart"}]',
  '["@KafkaListener","Consumer Group","ConsumerRecord","Manual Acknowledgment","Offset Management","Partition Assignment"]'
),
(
  'Dead Letter Topic Pattern',
  'Implement retry logic and a Dead Letter Topic (DLT) for a payment event consumer.

▸ Annotate the class as a Spring @Component
▸ Add @RetryableTopic(attempts = "3", backoff = @Backoff(delay = 1000, multiplier = 2.0)) above the listener
▸ Listen to the "payments" topic with groupId = "payment-processors"
▸ Simulate a transient failure by throwing RuntimeException for malformed payloads
▸ Add a separate @DltHandler method to log and store permanently failed messages

Concept check: @RetryableTopic creates intermediate retry topics (payments-retry-0, payments-retry-1 …) automatically. After all retries are exhausted the message is forwarded to payments-dlt, keeping the main topic unblocked.',
  'MEDIUM',
  'Kafka',
  900,
  'import org.springframework.kafka.annotation.DltHandler;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.retry.annotation.Backoff;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

// TODO: Annotate as @Component and @Slf4j
// TODO: Add @RetryableTopic(attempts = "3", backoff = @Backoff(delay = 1000, multiplier = 2.0))
// TODO: Add @KafkaListener(topics = "payments", groupId = "payment-processors")
// TODO: Throw RuntimeException for payload == null or blank to simulate failure
// TODO: Add @DltHandler method to handle permanently failed messages

public class PaymentEventConsumer {

    // TODO: Implement processPayment(String payload) with retry + listener annotations

    // TODO: Implement handleDlt(String payload) with @DltHandler
}',
  '[{"id":"t1","label":"@Component annotation present","weight":16},{"id":"t2","label":"@RetryableTopic annotation used","weight":17},{"id":"t3","label":"@Backoff configured on retry","weight":17},{"id":"t4","label":"@KafkaListener for payments topic","weight":17},{"id":"t5","label":"RuntimeException thrown for invalid payload","weight":17},{"id":"t6","label":"@DltHandler method present","weight":16}]',
  '[{"id":"h1","text":"@RetryableTopic must be placed directly above @KafkaListener on the same method"},{"id":"h2","text":"attempts = \"3\" means 1 original attempt + 2 retries before the DLT"},{"id":"h3","text":"The @DltHandler method receives the same payload type as the listener — use it to log or persist the failure"},{"id":"h4","text":"Exponential backoff: delay 1 s → 2 s → 4 s; multiplier controls the growth rate"}]',
  '["@RetryableTopic","Dead Letter Topic","@DltHandler","@Backoff","Retry Policy","Fault Tolerance","Event-Driven"]'
),
(
  'Transactional Kafka Producer',
  'Implement exactly-once semantics by combining a database write with a Kafka publish inside a single transaction.

▸ Create TransactionalOrderService annotated with @Service
▸ Inject both an OrderRepository and a KafkaTemplate via constructor injection
▸ Implement processOrder(Order order) annotated with @Transactional
▸ Inside the method: save the order via repository, then publish to "order-events" topic
▸ Create a @Configuration class KafkaProducerConfig that declares a ProducerFactory bean with transactionalIdPrefix = "order-tx-"

Concept check: Setting transactional.id on the producer enables idempotent delivery and multi-partition atomicity. If the DB commit rolls back, the Kafka send is also aborted — preventing ghost events from reaching consumers.',
  'HARD',
  'Kafka',
  1200,
  'import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// TODO: Create TransactionalOrderService @Service
//   - Inject KafkaTemplate and OrderRepository (constructor injection)
//   - Implement processOrder(@Transactional):
//       1. repository.save(order)
//       2. kafkaTemplate.send("order-events", order.getId().toString(), order.toString())

// TODO: Create KafkaProducerConfig @Configuration
//   - ProducerFactory @Bean with transactionalIdPrefix = "order-tx-"
//   - KafkaTemplate @Bean using the factory above

public class TransactionalOrderService {
    // TODO: Implement processOrder
}

class KafkaProducerConfig {
    // TODO: Declare ProducerFactory and KafkaTemplate beans
}',
  '[{"id":"t1","label":"@Service on TransactionalOrderService","weight":14},{"id":"t2","label":"@Transactional on processOrder","weight":15},{"id":"t3","label":"repository.save() called","weight":14},{"id":"t4","label":"kafkaTemplate.send() called","weight":14},{"id":"t5","label":"@Configuration on KafkaProducerConfig","weight":14},{"id":"t6","label":"ProducerFactory @Bean declared","weight":15},{"id":"t7","label":"transactionalIdPrefix configured","weight":14}]',
  '[{"id":"h1","text":"@Transactional wraps both the DB save and the Kafka send — if either fails, both roll back"},{"id":"h2","text":"Use DefaultKafkaProducerFactory and call factory.setTransactionIdPrefix(\"order-tx-\") in the bean"},{"id":"h3","text":"KafkaTemplate must be created from the transactional ProducerFactory, not the default auto-configured one"},{"id":"h4","text":"Spring''s KafkaTransactionManager participates in the same transaction as JPA when both are configured correctly"}]',
  '["@Transactional","Exactly-Once Semantics","Transactional Producer","Idempotent Producer","ProducerFactory","KafkaTemplate","Outbox Pattern"]'
);
