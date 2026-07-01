# Integração WhatsApp (Meta Cloud API) Specification

## Problem Statement

WhatsApp is the primary communication channel for Floworship's musicians. The integration uses the official Meta Cloud API (never unofficial simulators like Z-API) to send templated messages for availability collection, schedule confirmation, urgent substitutions, and repertoire publication. Messages initiated outside the 24h user-message window MUST use Meta-approved templates. Responses are handled via Reply Buttons (up to 3 options) and List Messages (multiple Sundays), with webhooks processing the `button_reply.id` to update the database. Opt-in is mandatory — collected during invite acceptance.

## Goals

- [ ] Official Meta Cloud API as the only WhatsApp provider *(REQ-WA-01)*
- [ ] Meta-approved templates for all outbound messages outside 24h window *(REQ-WA-02)*
- [ ] Reply Buttons (up to 3) for binary responses; List Messages for multi-option *(REQ-WA-03)*
- [ ] Required templates: `disponibilidade_mensal`, `escala_confirmada`, `substituicao_urgente`, `lembrete_disponibilidade`, `repertorio_definido` — all approved in Meta Business Manager before testing *(REQ-WA-04)*
- [ ] Backend → Cloud API → user responds → webhook → update DB *(REQ-WA-05)*
- [ ] Webhook validates Meta signature before processing *(REQ-WA-06)*
- [ ] `musician.whatsapp_phone` (E.164), `musician.whatsapp_opt_in` (boolean), `whatsapp_message_log` *(REQ-WA-07)*
- [ ] Opt-in mandatory, collected at invite acceptance *(REQ-WA-08)*
- [ ] WhatsApp as primary channel; app shifts to consultation/execution role *(REQ-WA-09)*

## Out of Scope

| Feature | Reason |
|---|---|
| Two-way free-text conversation | REQ-WA-03: structured buttons/lists only |
| WhatsApp Business Profile setup | Meta Business Manager setup is manual/admin task |
| Template creation/approval workflow | Admin creates templates in Meta Business Manager; not automated |
| WhatsApp media messages (images, audio) | Not specified |
| Group messaging | Not specified; messages are per-individual |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| Meta Cloud API access | Direct API (not via Twilio wrapper) for simplicity; Twilio as future option | Reduces dependency; direct API is simpler for template management. | n |
| Webhook endpoint | `POST /webhooks/whatsapp` with Meta signature validation | Standard webhook pattern; Fastify route. | n |
| Template parameters | Each template defines its parameters (e.g., `{musician_name}`, `{sunday_date}`, `{song_list}`) | Standard Meta template format. | n |
| Response handling | `button_reply.id` maps to a predefined action (e.g., `confirm`, `decline`, `unavailable`) | REQ-WA-05: "Meta envia webhook com button_reply.id". | n |
| Phone number format | E.164 (`+5511999999999`) stored in `musician.whatsapp_phone` | REQ-WA-07: "E.164". | n |
| Opt-in collection | Checkbox at invite acceptance: "Concordo em receber mensagens no WhatsApp" | REQ-WA-08: "Consentimento explícito coletado no aceite do convite". | n |
| Message logging | Every template sent is logged in `whatsapp_message_log` with status | REQ-WA-07: full logging model. | n |
| Retry on API failure | 3 attempts with exponential backoff (1s, 2s, 4s) | Standard resilience pattern. | n |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: WhatsApp Provider Integration ⭐ MVP

**User Story**: As a developer, I want a WhatsApp service layer that sends templates via the official Meta Cloud API and processes webhook responses so that the scheduling engine can communicate with musicians.

**Why P1**: Foundation for all WhatsApp-dependent features (B9 substitutions, B8 repertoire notification).

**Acceptance Criteria**:

1. WHEN the backend sends a WhatsApp message THEN it SHALL use the official Meta Cloud API (`POST https://graph.facebook.com/v18.0/{phone_id}/messages`). *(REQ-WA-01)*
2. WHEN sending a template message outside the 24h window THEN the template MUST be pre-approved in Meta Business Manager. *(REQ-WA-02)*
3. WHEN the API call fails THEN the system SHALL retry up to 3 times with exponential backoff; after 3 failures, log the error and mark the message as `"failed"` in `whatsapp_message_log`. *(Implicit resilience)*
4. WHEN a template is sent THEN it SHALL be logged in `whatsapp_message_log` with: `musician_id`, `template_name`, `context`, `sent_at`, `status` (`sent`/`delivered`/`read`/`failed`). *(REQ-WA-07)*

**Independent Test**: Configure Meta API credentials → send test template to opted-in musician → message logged → delivery status updated via webhook.

---

### P1: Webhook Response Processing ⭐ MVP

**User Story**: As a system, I want to receive and process WhatsApp webhook responses (button clicks, list selections) so that availability confirmations and schedule responses update the database automatically.

**Why P1**: REQ-WA-05; closes the loop between outbound messages and database updates.

**Acceptance Criteria**:

1. WHEN Meta sends a webhook with `button_reply.id` THEN the backend SHALL validate the Meta signature before processing. *(REQ-WA-06)*
2. WHEN the `button_reply.id` maps to an availability response THEN the corresponding `availability_response` record SHALL be updated. *(REQ-WA-05)*
3. WHEN the `button_reply.id` maps to a substitution response THEN the corresponding `service_assignment` SHALL be updated (accept/decline). *(REQ-WA-05 + REQ-SCHED-05)*
4. WHEN the webhook payload is malformed or the signature is invalid THEN the endpoint SHALL return 400/401 and NOT process the payload. *(Security)*

**Independent Test**: Send webhook payload with valid signature → database updated → send with invalid signature → 401 rejected.

---

### P1: Message Templates (5 required) ⭐ MVP

**User Story**: As an admin, I want the 5 required WhatsApp templates ready and approved so that the scheduling engine can send them when needed.

**Why P1**: REQ-WA-04; templates must be approved before any end-to-end testing.

**Acceptance Criteria**:

1. WHEN `disponibilidade_mensal` template is defined THEN it SHALL include parameters: `{month_name}`, `{response_deadline}`, and a List Message with available Sundays. *(REQ-WA-04)*
2. WHEN `escala_confirmada` template is defined THEN it SHALL include parameters: `{sunday_date}`, `{role}`, `{song_list}` and a Reply Button "Ver no App". *(REQ-WA-04)*
3. WHEN `substituicao_urgente` template is defined THEN it SHALL include parameters: `{sunday_date}`, `{role}`, `{original_musician}` and Reply Buttons "Aceitar" / "Recusar". *(REQ-WA-04)*
4. WHEN `lembrete_disponibilidade` template is defined THEN it SHALL include parameters: `{sunday_date}`, `{deadline}` and Reply Buttons "Disponível" / "Indisponível". *(REQ-WA-04)*
5. WHEN `repertorio_definido` template is defined THEN it SHALL include parameters: `{sunday_date}`, `{song_count}`, and a button that opens Study Mode for the repertoire. *(REQ-WA-04 + REQ-REP-09)*
6. WHEN all 5 templates are submitted to Meta Business Manager THEN they SHALL be approved before any production testing. *(REQ-WA-04)*

**Independent Test**: Create all 5 templates in Meta Business Manager → submit for approval → all approved → send test of each → verify correct rendering.

---

### P1: Opt-in Collection ⭐ MVP

**User Story**: As a musician accepting an invite, I want to explicitly consent to receiving WhatsApp messages so that my phone number can be used by the scheduling engine.

**Why P1**: REQ-WA-08; legal requirement — no messages without consent.

**Acceptance Criteria**:

1. WHEN a musician receives an invite link THEN the invite acceptance form SHALL include a checkbox: "Concordo em receber mensagens no WhatsApp". *(REQ-WA-08)*
2. WHEN the musician accepts the invite with the checkbox checked THEN `musician.whatsapp_opt_in` SHALL be set to `true`. *(REQ-WA-08)*
3. WHEN the musician accepts without checking the checkbox THEN `whatsapp_opt_in` SHALL be `false` and their phone number SHALL NOT be included in any WhatsApp message batch. *(REQ-WA-08)*
4. WHEN `whatsapp_opt_in` is `false` THEN the scheduling engine SHALL skip this musician when sending template messages. *(REQ-WA-08)*

**Independent Test**: Accept invite with checkbox checked → opt_in = true → receive WhatsApp. Accept without → opt_in = false → no WhatsApp.

---

## Edge Cases

- WHEN a musician's phone number is invalid (not E.164 format) THEN the system SHALL reject the number during invite acceptance with a clear error.
- WHEN the Meta API returns a rate limit error THEN the system SHALL back off and retry after the suggested retry-after period.
- WHEN a musician blocks the WhatsApp number THEN delivery status SHALL update to `"failed"` and future messages to that musician SHALL be skipped for that template.
- WHEN the 24h user-message window is open THEN the system CAN send free-form messages (not just templates); but for simplicity, MVP always uses templates.
- WHEN a webhook is received for an already-processed message (idempotency) THEN the system SHALL acknowledge it without reprocessing.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| WA-01 | P1: Provider Integration | API | Pending |
| WA-02 | P1: Provider Integration | Templates | Pending |
| WA-03 | P1: Provider Integration | UX | Pending |
| WA-04 | P1: Message Templates | Templates | Pending |
| WA-05 | P1: Webhook Processing | Webhook | Pending |
| WA-06 | P1: Webhook Processing | Security | Pending |
| WA-07 | P1: Provider Integration | Logging | Pending |
| WA-08 | P1: Opt-in Collection | Consent | Pending |
| WA-09 | P1: Channel Strategy | Architecture | Pending |

**Coverage:** 9 total, 9 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Messages sent via official Meta Cloud API only (no Z-API or simulators)
- [ ] All 5 templates approved in Meta Business Manager before testing
- [ ] Webhook validates Meta signature and processes button_reply.id correctly
- [ ] Opt-in collected at invite acceptance; opt-out musicians excluded from batches
- [ ] All sent messages logged in `whatsapp_message_log`
- [ ] Retry logic handles temporary API failures (3 attempts, exponential backoff)