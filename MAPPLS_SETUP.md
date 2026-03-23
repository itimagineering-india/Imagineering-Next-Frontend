# Mappls (MapmyIndia) setup — Imagineering India web-next

Maps, address search, forward/reverse geocoding, and the Services map view use **Mappls**.

## 1. Console

1. Open [Mappls Console](https://auth.mappls.com/console/).
2. Create a project / app and enable:
   - **Web Maps / Vector Maps** (for `sdk.mappls.com` script)
   - **Search** (text search, geocode, reverse geocode)
   - **Place details** (to resolve eLoc → coordinates for autocomplete)
3. Copy your **static REST / map key** (used as `access_token` in query strings and in the map SDK URL).

## 2. Environment

In `.env.local`:

```bash
NEXT_PUBLIC_MAPPLS_ACCESS_TOKEN=your_static_key_here
```

## 3. Domain whitelist

In the console, whitelist your production and local dev origins (e.g. `http://localhost:3000`, your Amplify/Vercel domain).

## 4. Docs

- [Web Maps JS](https://developer.mappls.com/documentation/sdk/Web/Web%20JS/)
- [Reverse geocode](https://developer.mappls.com/documentation/sdk/rest-apis/mappls-maps-reverse-geocoding-rest-api-example/Readme/)
- [Geocode](https://developer.mappls.com/documentation/sdk/rest-apis/mappls-maps-geocoding-rest-api-example/Readme/)
- [Text search](https://developer.mappls.com/documentation/sdk/rest-apis/mappls-textsearch-api/readme/)

## Note

`usePlacesAutocomplete` (Google Places) may still be used in some booking flows. Migrate those separately if you want zero Google Maps usage.
