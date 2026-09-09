# Oasis roadmap

## In progress
- [x] Order lifecycle model + mapping (`src/lib/order-status.ts`)
- [x] Razorpay + Stripe adapters and signature verification
- [x] Order confirmation route `/order/$reference`
- [x] Live `/track-order` wired to the order connector
- [x] Gift finder `/gift-finder`
- [x] Account area `/account` (addresses, orders, saved gifts, consents)
- [x] Support `/support` with reason taxonomy + fail-closed connector
- [x] Policy pages `/returns`, `/privacy`, `/terms`
- [x] Checkout hardening (form semantics, state/line2/notes/GST, reprice, redirect)
- [ ] Corporate recipient review/correction table
- [ ] Build-a-gift production-safe wording
- [ ] Admin status: software readiness vs external blockers
- [x] Remove remaining dev wording from public copy

## Brand/data correction pass (authoritative: oasisbaklawa.com Wix)
- [x] Central `src/data/brand.ts`: logo, brand media, locations, contact
- [x] Real Oasis logo in header/footer (horizontal wordmark asset)
- [x] Replace generic imagery with real Wix product/factory media
- [x] Rebuild SHOP / GIFTING / DISCOVER / SERVICE navigation (desktop + mobile)
- [x] Taxonomy from real Wix collections; fix label typos
- [x] Our Story: history, mission, vision, core values, TCF ownership
- [x] Stores: published location list, no invented hours
- [x] Contact: +91 72919 94141, info@oasisbaklawa.com, Kirti Nagar HO
- [x] Top sellers merchandising with real product photos
- [x] QA: typecheck, tests, build, mobile checks
