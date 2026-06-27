# documentLinks API — Sample Calls

## GET — Fetch all links for a source document

```
GET /api/documentLinks?srcId=88cc8353-2ac5-4666-ba1a-db9c2c015e12
```

Expected response:
```json
[
  {
    "id": "d1e2f3a4-5b6c-7d8e-9f0a-1b2c3d4e5f6a",
    "link_side": "A",
    "target_document_gender": "F",
    "specific_article": true,
    "target_article_text": "Artículo 15",
    "target_article_anchor": "art-15",
    "link_text": "Reglamenta el artículo 15 de la Resolución 123 de 2024",
    "external_link": false,
    "external_url": null,
    "source_document_id": "88cc8353-2ac5-4666-ba1a-db9c2c015e12",
    "target_document_id": "cccdb040-97a0-4741-9c83-6221b5a1296c",
    "link_type_id": "6723ddb6-6534-49dc-8ce0-2c82f2606122",
    "link_type_name": "Reglamenta",
    "active_verb": "Reglamenta",
    "has_passive_form": true,
    "passive_verb_masculine": "Reglamentado por",
    "passive_verb_feminine": "Reglamentada por"
  }
]
```

---

## POST — Create a new link

Triggered when a spot has no `data-link-document-id` yet.

```
POST /api/documentLink
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
PUT /api/documentLink/d1e2f3a4-5b6c-7d8e-9f0a-1b2c3d4e5f6a
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

| Field | Type | Nullable | Values |
|---|---|---|---|
| `link_id` | UUID string | no | `data-vrl-id` of the `<note-wrapper>` in the HTML |
| `source_document_id` | UUID string | yes | `id` of the document whose HTML content embeds the link (from `<meta name="vrl-document-id">`) |
| `target_document_id` | UUID string | yes | `id` of the internal document the link points to; `null` when `external_link` is true |
| `link_type_id` | UUID string | no | from `vindexrl.link_type.id` |
| `link_side` | `"A"` or `"P"` | no | Active / Passive |
| `target_document_gender` | `"M"` or `"F"` | no | Masculine / Feminine |
| `specific_article` | boolean | no | drives whether article fields are populated |
| `target_article_text` | string or `null` | yes | only set when `specific_article` is true |
| `target_article_anchor` | string or `null` | yes | only set when `specific_article` is true |
| `link_text` | string or `null` | yes | final computed or manually edited text |
