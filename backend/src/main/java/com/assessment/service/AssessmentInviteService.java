package com.assessment.service;

import com.assessment.model.AssessmentInvite;
import com.assessment.model.CandidateSession;
import com.assessment.model.Challenge;
import com.assessment.repository.AssessmentInviteRepository;
import com.assessment.repository.CandidateSessionRepository;
import com.assessment.repository.ChallengeRepository;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Recruiter-created, single-use assessment links. An invite fixes the candidate (name/email), the
 * ordered challenge set and a start-by expiry; using it creates exactly one {@link CandidateSession}.
 */
@Service
@RequiredArgsConstructor
public class AssessmentInviteService {

    public static final int DEFAULT_EXPIRY_DAYS = 7;
    public static final int MAX_EXPIRY_DAYS = 30;

    private static final SecureRandom RANDOM = new SecureRandom();

    private final AssessmentInviteRepository inviteRepository;
    private final ChallengeRepository challengeRepository;
    private final CandidateSessionRepository sessionRepository;

    /** Error with the HTTP status the controller should return. */
    @Getter
    public static class InviteException extends RuntimeException {
        private final HttpStatus status;
        public InviteException(HttpStatus status, String message) {
            super(message);
            this.status = status;
        }
    }

    // ── Recruiter side ──────────────────────────────────────────────────────

    @Transactional
    public AssessmentInvite create(String title, String candidateName, String candidateEmail,
                                   List<Long> challengeIds, Integer expiresInDays) {
        if (isBlank(title) || isBlank(candidateName) || isBlank(candidateEmail)) {
            throw new InviteException(HttpStatus.BAD_REQUEST, "Title, candidate name and candidate email are required");
        }
        // De-duplicate while keeping the recruiter's order (= candidate's tab order)
        List<Long> ids = challengeIds == null ? List.of()
                : new ArrayList<>(new LinkedHashSet<>(challengeIds.stream().filter(Objects::nonNull).toList()));
        if (ids.isEmpty()) {
            throw new InviteException(HttpStatus.BAD_REQUEST, "Select at least one challenge");
        }
        Set<Long> existing = challengeRepository.findAllById(ids).stream().map(Challenge::getId).collect(Collectors.toSet());
        List<Long> unknown = ids.stream().filter(id -> !existing.contains(id)).toList();
        if (!unknown.isEmpty()) {
            throw new InviteException(HttpStatus.BAD_REQUEST, "Unknown challenge id(s): " + unknown);
        }
        int days = expiresInDays == null ? DEFAULT_EXPIRY_DAYS : expiresInDays;
        if (days < 1 || days > MAX_EXPIRY_DAYS) {
            throw new InviteException(HttpStatus.BAD_REQUEST, "Expiry must be between 1 and " + MAX_EXPIRY_DAYS + " days");
        }

        LocalDateTime now = LocalDateTime.now();
        AssessmentInvite invite = new AssessmentInvite();
        invite.setToken(newToken());
        invite.setTitle(title.trim());
        invite.setCandidateName(candidateName.trim());
        invite.setCandidateEmail(candidateEmail.trim());
        invite.setChallengeIds(ids);
        invite.setCreatedAt(now);
        invite.setExpiresAt(now.plusDays(days));
        invite.setStatus(AssessmentInvite.Status.PENDING);
        return inviteRepository.save(invite);
    }

    @Transactional
    public AssessmentInvite revoke(Long id) {
        AssessmentInvite invite = inviteRepository.findById(id)
                .orElseThrow(() -> new InviteException(HttpStatus.NOT_FOUND, "Invite not found"));
        if (invite.getStatus() != AssessmentInvite.Status.PENDING) {
            throw new InviteException(HttpStatus.CONFLICT, "Only unused links can be revoked");
        }
        invite.setStatus(AssessmentInvite.Status.REVOKED);
        return inviteRepository.save(invite);
    }

    /** All invites, newest first, shaped for the recruiter dashboard. */
    public List<Map<String, Object>> listForRecruiter() {
        List<AssessmentInvite> invites = inviteRepository.findAllByOrderByCreatedAtDesc();
        Map<Long, Challenge> challenges = challengeRepository.findAll().stream()
                .collect(Collectors.toMap(Challenge::getId, Function.identity()));
        Map<String, CandidateSession> sessions = sessionRepository.findAll().stream()
                .collect(Collectors.toMap(CandidateSession::getSessionId, Function.identity(), (a, b) -> a));
        LocalDateTime now = LocalDateTime.now();
        return invites.stream().map(inv -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", inv.getId());
            m.put("token", inv.getToken());
            m.put("title", inv.getTitle());
            m.put("candidateName", inv.getCandidateName());
            m.put("candidateEmail", inv.getCandidateEmail());
            m.put("challenges", inv.getChallengeIds().stream()
                    .map(challenges::get).filter(Objects::nonNull)
                    .map(c -> Map.of("id", c.getId(), "title", c.getTitle()))
                    .toList());
            m.put("totalTimeSeconds", totalTimeSeconds(inv.getChallengeIds()));
            m.put("createdAt", iso(inv.getCreatedAt()));
            m.put("expiresAt", iso(inv.getExpiresAt()));
            m.put("startedAt", iso(inv.getStartedAt()));
            m.put("sessionId", inv.getSessionId());
            m.put("state", recruiterState(inv, sessions.get(inv.getSessionId()), now));
            return m;
        }).toList();
    }

    /** sessionId → invite title, for labelling sessions on the dashboard. */
    public Map<String, String> titlesBySessionId() {
        return inviteRepository.findAll().stream()
                .filter(i -> i.getSessionId() != null)
                .collect(Collectors.toMap(AssessmentInvite::getSessionId, AssessmentInvite::getTitle, (a, b) -> a));
    }

    // ── Candidate side ──────────────────────────────────────────────────────

    /** What the public landing page for a link may show. Never includes challenge content. */
    public Map<String, Object> describe(String token) {
        AssessmentInvite inv = inviteRepository.findByToken(token)
                .orElseThrow(() -> new InviteException(HttpStatus.NOT_FOUND, "This assessment link is not valid"));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("title", inv.getTitle());
        m.put("candidateName", inv.getCandidateName());
        m.put("challengeCount", inv.getChallengeIds().size());
        m.put("totalTimeSeconds", totalTimeSeconds(inv.getChallengeIds()));
        m.put("expiresAt", iso(inv.getExpiresAt()));
        m.put("state", candidateState(inv, LocalDateTime.now()));
        return m;
    }

    /**
     * Uses the link: creates the candidate session (timer = sum of this invite's challenge limits)
     * and atomically marks the invite STARTED. Throws if the link is unknown, expired, revoked or used.
     */
    @Transactional
    public CandidateSession start(String token) {
        if (isBlank(token)) throw new InviteException(HttpStatus.BAD_REQUEST, "An assessment link is required");
        AssessmentInvite inv = inviteRepository.findByToken(token)
                .orElseThrow(() -> new InviteException(HttpStatus.NOT_FOUND, "This assessment link is not valid"));
        LocalDateTime now = LocalDateTime.now();
        switch (candidateState(inv, now)) {
            case "EXPIRED" -> throw new InviteException(HttpStatus.GONE, "This assessment link has expired. Please contact your recruiter.");
            case "REVOKED" -> throw new InviteException(HttpStatus.GONE, "This assessment link has been revoked. Please contact your recruiter.");
            case "USED"    -> throw new InviteException(HttpStatus.CONFLICT, "This assessment link has already been used.");
            default -> { }
        }

        CandidateSession session = new CandidateSession();
        session.setSessionId(UUID.randomUUID().toString());
        session.setCandidateName(inv.getCandidateName());
        session.setCandidateEmail(inv.getCandidateEmail());
        session.setStartTime(now);
        session.setStatus(CandidateSession.SessionStatus.ACTIVE);
        int total = totalTimeSeconds(inv.getChallengeIds());
        session.setTimeLimitSeconds(total > 0 ? total : null);

        // Claim first: if we lose the race, the exception rolls back before any session row is written.
        int claimed = inviteRepository.claim(inv.getId(), session.getSessionId(), now,
                AssessmentInvite.Status.PENDING, AssessmentInvite.Status.STARTED);
        if (claimed == 0) {
            throw new InviteException(HttpStatus.CONFLICT, "This assessment link has already been used.");
        }
        return sessionRepository.save(session);
    }

    /**
     * Challenge ids the session may load/submit, in tab order. Empty Optional = session predates
     * invites (or is not a candidate session) — callers fall back to the legacy global active set.
     */
    public Optional<List<Long>> allowedChallengeIds(String sessionId) {
        if (sessionId == null) return Optional.empty();
        return inviteRepository.findBySessionId(sessionId).map(inv -> List.copyOf(inv.getChallengeIds()));
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    public int totalTimeSeconds(List<Long> challengeIds) {
        return challengeRepository.findAllById(challengeIds).stream()
                .map(Challenge::getTimeLimitSeconds).filter(Objects::nonNull)
                .mapToInt(Integer::intValue).sum();
    }

    private static String candidateState(AssessmentInvite inv, LocalDateTime now) {
        if (inv.getStatus() == AssessmentInvite.Status.REVOKED) return "REVOKED";
        if (inv.getStatus() == AssessmentInvite.Status.STARTED) return "USED";
        if (inv.isLinkExpired(now)) return "EXPIRED";
        return "VALID";
    }

    private static String recruiterState(AssessmentInvite inv, CandidateSession session, LocalDateTime now) {
        if (inv.getStatus() == AssessmentInvite.Status.REVOKED) return "REVOKED";
        if (inv.getStatus() == AssessmentInvite.Status.PENDING) return inv.isLinkExpired(now) ? "LINK_EXPIRED" : "PENDING";
        if (session == null) return "SESSION_DELETED";
        return switch (session.getStatus()) {
            case ACTIVE -> session.isPastDeadline(now, 0) ? "TIMED_OUT" : "IN_PROGRESS";
            case COMPLETED -> "COMPLETED";
            case EXPIRED -> "TIMED_OUT";
        };
    }

    /** Server-local timestamp → ISO-8601 instant ("…Z") so browsers in any timezone read it correctly. */
    private static String iso(LocalDateTime t) {
        return t == null ? null : t.atZone(ZoneId.systemDefault()).toInstant().toString();
    }

    private static String newToken() {
        byte[] bytes = new byte[18]; // 144 bits → 24 URL-safe chars
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
