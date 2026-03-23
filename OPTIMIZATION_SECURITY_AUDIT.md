# Website Optimization & Security Audit

**Date:** March 2025  
**Scope:** web-next (Next.js frontend) + backend

---

## ✅ What's Already Good

### Security (Backend)
- **Helmet** – Security headers (XSS, MIME sniffing, etc.)
- **CORS** – Proper origin validation, credentials support
- **Rate limiting** – Global (700/15min), Auth (15/15min), Firebase sync (20/15min)
- **JWT** – Production requires strong JWT_SECRET (min 32 chars)
- **HSTS** – Enabled in production (1 year)
- **Frameguard** – Clickjacking protection (sameorigin)
- **CSP** – Content-Security-Policy in production
- **Compression** – gzip for responses > 1KB

### Security (Frontend)
- **Token validation** – `validateToken()` checks expiry before API calls
- **401 handling** – Auto-logout and redirect on session expiry
- **API timeout** – 10s default, prevents hanging requests
- **Auth token** – Stored in localStorage, cleared on logout

### Optimization
- **Canonical URLs** – All pages have unique canonicals
- **Metadata** – Title template, description, robots
- **Sitemap** – Static + category pages
- **Robots.txt** – Disallows /api/, /admin/, /_next/
- **React Compiler** – Enabled in next.config
- **Revalidation** – Category pages use `revalidate` (900–3600s)
- **API caching** – 5 min TTL for responses
- **Suspense** – Login, Signup, Chat use Suspense for loading states

---

## ⚠️ Gaps & Recommendations

### 1. Image Optimization (High Impact)
**Issue:** Most images use raw `<img>` instead of Next.js `Image` component.
- **Affected:** HeroSection, Footer, Header, ServiceCard, ProviderProfile, etc. (~25+ components)
- **Impact:** No automatic lazy loading, no WebP/AVIF, no responsive srcset
- **Fix:** Replace `<img>` with `next/image` where possible. For external URLs (CDN), add domains to `next.config.ts`:

```ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'dwkazjggpovin.cloudfront.net', pathname: '/**' },
    { protocol: 'https', hostname: '*.cloudfront.net', pathname: '/**' },
  ],
},
```

### 2. XSS Risk – dangerouslySetInnerHTML (Medium)
**Issue:** `ProviderSupport.tsx` renders `policy.content` with `dangerouslySetInnerHTML` without sanitization.
- **Risk:** If policy content comes from admin/CMS and is not sanitized on backend, stored XSS is possible
- **Fix:** Sanitize HTML on backend before storing, or use `DOMPurify` on frontend before rendering

**Lower risk (JSON-LD):** `BreadcrumbJsonLd`, `ServiceJsonLd`, `LocalBusinessJsonLd` use `JSON.stringify()` – safe.

**MapboxMap.tsx:** `div.innerHTML = content` – content comes from marker data; ensure it's sanitized or from trusted source.

### 3. Next.js Middleware (Security Headers)
**Issue:** No `middleware.ts` in web-next for security headers.
- **Fix:** Add `middleware.ts` at project root to set:
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`

### 4. Sitemap Coverage
**Issue:** Sitemap only includes `""`, `/about`, `/contact`, and category pages.
- **Missing:** `/services`, `/pricing`, `/community`, `/help`, `/careers`, city pages, service detail pages
- **Fix:** Expand sitemap with more static routes; consider dynamic service/city URLs if slug list is available

### 5. Lazy Loading / Code Splitting
**Issue:** No `dynamic()` imports for heavy components (e.g. MapboxMap, Chart, Payment modals).
- **Impact:** Larger initial bundle, slower FCP/LCP
- **Fix:** Use `next/dynamic` with `ssr: false` for map, charts, payment SDKs

### 6. API Base URL Inconsistency
**Issue:** Some files use `localhost:5000`, others `localhost:5001` as fallback.
- **Fix:** Standardize to single constant (e.g. from `NEXT_PUBLIC_API_BASE_URL`)

### 7. Dashboard / Auth Pages – robots
**Issue:** Dashboard and auth pages inherit `index: true` from layout.
- **Recommendation:** Add `robots: { index: false, follow: false }` for `/dashboard/*`, `/login`, `/signup`, `/profile`, `/chat` to avoid indexing user-specific pages

### 8. Environment Variables
**Issue:** `NEXT_PUBLIC_*` vars are exposed to client – ensure no secrets.
- **Current:** API URL, Firebase config, Mapbox token, Cashfree mode – all appropriate for client
- **Check:** Ensure no backend secrets (JWT_SECRET, DB URL, etc.) are in `NEXT_PUBLIC_*`

---

## Summary Scorecard

| Area           | Status | Notes                                      |
|----------------|--------|--------------------------------------------|
| Backend Security | ✅ Good | Helmet, CORS, rate limit, JWT, HSTS        |
| Frontend Auth  | ✅ Good | Token validation, 401 handling             |
| Image Opt      | ⚠️ Weak | Mostly raw `<img>`, no next/image          |
| XSS            | ⚠️ Risk | policy.content unsanitized                 |
| Headers (Next) | ⚠️ Missing | No middleware for security headers        |
| SEO            | ✅ Good | Canonicals, metadata, sitemap              |
| Performance    | ⚠️ Partial | No lazy load for heavy components         |
| Sitemap        | ⚠️ Partial | Limited static + categories                |

---

## Quick Wins to Implement

1. Add `next.config.ts` image config for CDN domains
2. Add `middleware.ts` with security headers
3. Add `robots: { index: false }` for dashboard/auth pages
4. Sanitize `policy.content` before render (DOMPurify or backend)
5. Expand sitemap with `/services`, `/pricing`, `/community`, `/help`, `/careers`
