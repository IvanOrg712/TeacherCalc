# Subscription System API

## 8. Plans & Billing

**List Plans**
- Endpoint: `GET /api/plans`
- Description: Returns available subscription tiers (e.g., Free, Pro).

Response (200 OK):
```json
[
  {
    "id": 1,
    "name": "Free",
    "description": "Basic features",
    "price": 0,
    "max_students": 50
  },
  {
    "id": 2,
    "name": "Pro",
    "description": "Unlimited students & advanced analytics",
    "price": 9.99,
    "max_students": -1 // Unlimited
  }
]
```

**Get Current Subscription**
- Endpoint: `GET /api/subscription`
- Description: Retrieves the current active subscription status.

Response (200 OK):
```json
{
  "subscription_id": 101,
  "plan": {
    "id": 2,
    "name": "Pro"
  },
  "status": "active", // active, past_due, canceled
  "current_period_end": "2025-02-01",
  "auto_renew": true
}
```

**Upgrade/Downgrade Subscription**
- Endpoint: `POST /api/subscription/change`
- Description: Changes the user's plan. In a real scenario, this would interface with a payment provider (Stripe/PayPal).

Request Body:
```json
{
  "plan_id": 2,
  "payment_method_id": "pm_12345" // If applicable
}
```

Response (200 OK):
```json
{
  "message": "Subscription updated successfully",
  "new_plan": "Pro"
}
```

**Cancel Subscription**
- Endpoint: `POST /api/subscription/cancel`
- Description: Cancels auto-renewal at the end of the current period.

Response (200 OK):
```json
{
  "message": "Subscription will end on 2025-02-01",
  "auto_renew": false
}
```
