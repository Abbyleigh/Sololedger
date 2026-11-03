# Stage 11 acceptance test matrix

This is a pre-implementation checklist. No test is marked passed until executed against working code.

## Guest mode
- [ ] Open workspace without account or internet after assets cached.
- [ ] Create customer, income, expense, invoice and payment.
- [ ] Verify calculations unchanged from production.
- [ ] Export, delete and restore JSON data.
- [ ] Guest records never leave browser without explicit migration consent.

## Authentication
- [ ] Register, verify email, log in and log out.
- [ ] Reject invalid credentials and expired recovery links.
- [ ] Password reset works without exposing account existence.
- [ ] Refresh and session expiration behave correctly.
- [ ] Guest can continue without registering.

## Isolation
- [ ] User A cannot select, insert, update or delete User B's records.
- [ ] Unauthenticated requests cannot access protected records.
- [ ] Forged owner_id cannot bypass RLS.
- [ ] Cross-owner customer/invoice references fail.
- [ ] Privileged keys never appear in frontend assets.

## Finance and synchronisation
- [ ] Amounts remain integer pence and summaries match production.
- [ ] Invoice payment is atomic, retry-safe and idempotent.
- [ ] Concurrent invoice creation cannot duplicate invoice numbers.
- [ ] Multi-device updates do not silently overwrite changes.
- [ ] Offline guest operations remain functional.

## Migration and lifecycle
- [ ] Guest-to-account import requires consent and offers JSON backup.
- [ ] Interrupted migration can resume without duplicate records.
- [ ] Imported counts, totals, invoice references and payment links reconcile.
- [ ] Failed migration preserves guest data.
- [ ] Account deletion clears cloud records and follows documented retention.
- [ ] Cloud restore/recovery is tested, not merely assumed.

## Release gate
- [ ] Source archive committed and verified against current live release.
- [ ] All existing tests pass on main and feature branch.
- [ ] Privacy and terms updated before enabling cloud accounts.
- [ ] Staging end-to-end tests use fictional data.
- [ ] Owner explicitly approves any new external account, expenditure or production deployment.
