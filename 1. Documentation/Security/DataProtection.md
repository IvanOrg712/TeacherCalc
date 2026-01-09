# Data Security & Protection Strategy

## 1. Row Level Security (RLS) Policy

To ensure strict data isolation in a multi-tenant environment (SaaS), we enforce **Row Level Security (RLS)** at the database layer. This ensures that even if an API endpoint fails to filter data, the database itself allows a user to access *only* the data they own.

### Authentication Context
We assume the database session has a variable (e.g., `app.current_teacher_id` or `auth.uid()`) set upon connection, representing the authenticated teacher's ID.

### Table Policies

| Table | Policy Strategy | Description |
| :--- | :--- | :--- |
| `teachers` | **Self-Access** | Users can only view/edit their own record (`id = current_user`). |
| `profiles` | **Self-Access** | Linked via `teacher_id`. |
| `schools` | **Direct Ownership** | `teacher_id = current_user`. |
| `subjects` | **Cascade Ownership** | Accessible if parent `school` belongs to user. |
| `groups` | **Cascade Ownership** | Accessible if parent `subject` (-> school) belongs to user. |
| `students` | **Association Check** | Accessible if the student is enrolled in any `group` owned by the user. |
| `grades` | **Association Check** | Accessible if the related `student` and `activity` are owned by the user. |
| `plans` | **Public Read** | Readable by everyone (Catalog). Write restricted to admins. |

## 2. PII & Data Encryption

### Personally Identifiable Information (PII)
The following fields are considered sensitive:

*   **Teachers**: `email`, `password_hash`
*   **Profiles**: `phone_number`, `birthdate`, `photo_url`
*   **Students**: `name` (Contextual PII)

### Encryption Strategy

1.  **Transport Encryption**: All connections must use **TLS 1.2+**.
2.  **At-Rest Encryption**:
    *   **Passwords**: Hashed using **v (Argon2id recommended)** or **bcrypt**.
    *   **High Sensitivity Fields**:
        *   `profiles.phone_number` -> **AES-256 Encrypted** column.
        *   `teachers.stripe_customer_id` -> **AES-256 Encrypted** column.
    *   **Standard Fields**:
        *   Student names and Emails are kept in plain text to allow for efficient searching and sorting, protected by strict RLS.

## 3. Database Hardening

*   **Least Privilege**: The API application user should NOT be a superuser. It should only have usage rights on the `public` schema.
*   **Input Sanitization**: Use Parameterized Queries (Prepared Statements) exclusively to prevent SQL Injection.
*   **Audit Logging**: Enable logging for `DELETE` operations on critical tables (`grades`, `schools`).
