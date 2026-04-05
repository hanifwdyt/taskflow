# TaskFlow — TODO & Known Issues

## 🔴 Critical (Blocking)

- [x] `auth-client.ts` baseURL hardcoded ke localhost — perlu env var
- [ ] Schema `email_verified` mismatch: better-auth expect `boolean`, DB still `timestamp` di kolom lama
- [ ] Seed script: password hash format salah (scrypt manual vs better-auth internal)
- [ ] Board creation silently fails: fetch tidak cek `res.ok` di frontend
- [ ] Infinite spinner di BoardPage kalau fetch gagal (no error state)

## 🟠 High Priority

- [ ] `DashboardPage.tsx` — createBoard: tidak handle error, board `undefined` masuk state
- [ ] `BoardPage.tsx` — drag & drop optimistic update tanpa rollback kalau API gagal
- [ ] DELETE board/task selalu return success meski tidak ada yang ke-delete
- [ ] Tidak ada validasi UUID di route params (GET /boards/:id, dll)
- [ ] Missing authorization check di task POST: user bisa buat task di board orang lain

## 🟡 Medium

- [ ] CORS_ORIGIN fallback ke localhost:5173 — bahaya di production
- [ ] Better-auth BETTER_AUTH_URL tidak di-set di .env (warning saat seed)
- [ ] Google OAuth belum dikonfigurasi (clientId/clientSecret kosong)
- [ ] Chrome Extension: URL API masih hardcode localhost:3001

## 🟢 Nice to Have

- [ ] Add loading & error states ke semua fetch calls
- [ ] Task detail modal (edit, due date, description)
- [ ] Board rename & delete dari UI
- [ ] Column reorder drag & drop
- [ ] Dark/light mode toggle
- [ ] Realtime sync antar tab/device
- [ ] PWA: test offline support
- [ ] Setup proper e2e tests (Playwright)

## ✅ Done

- [x] Monorepo setup (pnpm workspaces + turbo)
- [x] Hono API dengan auth middleware
- [x] Drizzle schema + migration
- [x] Better-auth email/password + Google OAuth (UI ready, backend ready)
- [x] React + Vite + PWA config
- [x] Futuristic dark UI dengan Framer Motion
- [x] Kanban board dengan dnd-kit
- [x] Chrome extension scaffold (popup + service worker)
- [x] Docker PostgreSQL setup
- [x] Shared types package

## 🐛 Bug Tracker

### Board Cannot Be Created
**Root cause:** `DashboardPage.tsx` tidak cek `res.ok` → kalau API error, `data.data` adalah `undefined` → board undefined masuk ke state → crash

**Fix:** Tambah error handling di `createBoard()` + cek response status

### Login 401
**Root cause:** Password di DB di-hash manual pakai scrypt, bukan format better-auth (argon2)
**Fix:** Hapus user lama → re-seed lewat HTTP endpoint (bukan direct DB call)

### Blank Page on Load
**Root cause:** better-auth `createAuthClient` error karena baseURL = `/api/auth` (relative path tidak valid)
**Fix:** Ganti ke `http://localhost:3001/api/auth` ✅ (sudah di-fix)
