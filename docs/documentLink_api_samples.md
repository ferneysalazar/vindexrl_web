# documentLink API — Sample Calls

## POST — Create a new link

Triggered when a spot has no `data-link-document-id` yet.

```
POST /documentLink
Content-Type: application/json

{
  "link_id": "a3f7c821-04b2-4e91-bf10-d9e3c5a10234",
  "source_document_id": "88cc8353-2ac5-4666-ba1a-db9c2c015e12",
  "target_document_id": "cccdb040-97a0-4741-9c83-6221b5a1296c",
  "link_type_id": "6723ddb6-6534-49dc-8ce0-2c82f2606122",
  "link_side": "A",
  "target_document_gender": "F",
  "specific_article": true,
  "target_article_text": "Artículo 15",
  "target_article_anchor": "art-15",
  "link_text": "Reglamenta el artículo 15 de la Resolución 123 de 2024"
}
```

Expected response (the frontend stores the returned `id` on the spot for future PUTs):
```json
{ "id": "d1e2f3a4-5b6c-7d8e-9f0a-1b2c3d4e5f6a" }
```

---

## PUT — Update an existing link

Triggered when the spot already has `data-link-document-id` (stored after a successful POST).

```
PUT /documentLink/d1e2f3a4-5b6c-7d8e-9f0a-1b2c3d4e5f6a
Content-Type: application/json

{
  "link_id": "a3f7c821-04b2-4e91-bf10-d9e3c5a10234",
  "source_document_id": "88cc8353-2ac5-4666-ba1a-db9c2c015e12",
  "target_document_id": "cccdb040-97a0-4741-9c83-6221b5a1296c",
  "link_type_id": "6723ddb6-6534-49dc-8ce0-2c82f2606122",
  "link_side": "P",
  "target_document_gender": "F",
  "specific_article": false,
  "target_article_text": null,
  "target_article_anchor": null,
  "link_text": "Reglamentada por la Resolución 123 de 2024"
}
```

---

## Field reference

| Field | Type | Values |
|---|---|---|
| `link_id` | UUID string | `data-vrl-id` of the `<note-wrapper>` in the HTML |
| `source_document_id` | UUID string | from `<meta name="vrl-document-id">` in the served HTML |
| `target_document_id` | UUID string | `id` of the doc clicked in the search results |
| `link_type_id` | UUID string | from `vindexrl.link_type.id` |
| `link_side` | `"A"` or `"P"` | Active / Passive |
| `target_document_gender` | `"M"` or `"F"` | Masculine / Feminine |
| `specific_article` | boolean | drives whether article fields are populated |
| `target_article_text` | string or `null` | only set when `specific_article` is true |
| `target_article_anchor` | string or `null` | only set when `specific_article` is true |
| `link_text` | string or `null` | final computed or manually edited text |
