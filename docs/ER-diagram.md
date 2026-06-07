# ER-діаграма бази даних (Humanitarian Logistics)

Актуальна схема відповідає сутностям JPA (`com.humanitarian.logistics.model`) та таблицям PostgreSQL. Діаграму можна переглянути в GitHub, VS Code (розширення Mermaid) або [mermaid.live](https://mermaid.live).

## Логічна ER-діаграма (Mermaid)

```mermaid
erDiagram
    users {
        BIGINT id PK
        VARCHAR username UK "not null, len 80"
        VARCHAR password_hash "not null, len 120"
        VARCHAR full_name "len 120"
        VARCHAR email "len 120"
        VARCHAR role "not null, enum UserRole"
    }

    warehouses {
        BIGINT id PK
        VARCHAR name "not null, len 160"
        VARCHAR address "len 255"
        VARCHAR region "len 120"
        INT capacity_units
    }

    cargo {
        BIGINT id PK
        VARCHAR name "not null, len 160"
        VARCHAR description "len 500"
        VARCHAR unit "not null, len 32"
        VARCHAR category "len 80"
    }

    warehouse_stock {
        BIGINT id PK
        BIGINT warehouse_id FK "not null"
        BIGINT cargo_id FK "not null"
        INT quantity_on_hand "not null"
    }

    transactions {
        BIGINT id PK
        VARCHAR type "not null, enum TransactionType"
        BIGINT from_warehouse_id FK "nullable"
        BIGINT to_warehouse_id FK "nullable"
        BIGINT cargo_id FK "not null"
        INT quantity "not null"
        TIMESTAMPTZ occurred_at "not null"
        VARCHAR notes "len 500"
        BIGINT related_request_id "nullable, логічне посилання на aid_requests.id"
    }

    aid_requests {
        BIGINT id PK
        BIGINT warehouse_id FK "not null"
        BIGINT cargo_id FK "not null"
        INT quantity_requested "not null"
        VARCHAR status "not null, enum RequestStatus"
        VARCHAR notes "len 500"
        TIMESTAMPTZ created_at "not null"
    }

    audit_log {
        BIGINT id PK
        TIMESTAMPTZ at "not null"
        BIGINT actor_user_id FK "nullable → users"
        VARCHAR actor_username "not null, len 80"
        VARCHAR actor_role "len 32"
        VARCHAR action "not null, len 64"
        VARCHAR entity_type "not null, len 64"
        BIGINT entity_id "nullable"
        VARCHAR details "len 2000"
    }

    users ||--o{ audit_log : "actor_user_id (опційно)"
    warehouses ||--o{ warehouse_stock : "warehouse_id"
    cargo ||--o{ warehouse_stock : "cargo_id"
    warehouses ||--o{ aid_requests : "warehouse_id"
    cargo ||--o{ aid_requests : "cargo_id"
    warehouses ||--o{ transactions : "from_warehouse_id"
    warehouses ||--o{ transactions : "to_warehouse_id"
    cargo ||--o{ transactions : "cargo_id"
```

## Обмеження та індекси

| Таблиця           | Обмеження / індекс |
|-------------------|--------------------|
| `warehouse_stock` | `UNIQUE (warehouse_id, cargo_id)` — один рядок залишку на пару склад + вантаж |
| `users`           | `UNIQUE (username)` |
| `audit_log`       | індекси: `at`, `(entity_type, entity_id)`, `actor_username` |

## Логічне посилання (не FK у JPA)

- У таблиці **`transactions`** поле **`related_request_id`** зберігає ідентифікатор заявки з **`aid_requests`** (зв’язок на рівні застосунку / бізнес-логіки, без окремого `@ManyToOne` у поточній моделі).

## Перелік enum-значень (для документації)

- **`UserRole`**: `ADMIN`, `COORDINATOR`, `OPERATOR`, `VIEWER`.
- **`TransactionType`**: `INBOUND`, `OUTBOUND`, `TRANSFER`.
- **`RequestStatus`**: `PENDING`, `APPROVED`, `REJECTED`, `FULFILLED`.

## Призначення `audit_log`

Фіксує **хто** (`actor_user_id`, `actor_username`, `actor_role`), **коли** (`at`), **що зробив** (`action`) і над **якою сутністю** (`entity_type`, `entity_id`, опційно `details`) — для прозорості змін транзакцій та статусів заявок тощо.
