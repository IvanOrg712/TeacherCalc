# Referrals & Rewards API

## 9. Growth System

**Get Referral Status**
- Endpoint: `GET /api/referrals`
- Description: Retrieves the user's unique referral code and a list of successful referrals.

Response (200 OK):
```json
{
  "my_referral_code": "ESTEBAN2025",
  "referrals": [
    {
      "referred_user": "Maria S.",
      "status": "qualified", // pending, qualified (paid), fraud
      "date": "2025-01-10"
    }
  ],
  "total_qualified": 1
}
```

**List Rewards**
- Endpoint: `GET /api/rewards`
- Description: Lists credits or rewards earned through the referral program.

Response (200 OK):
```json
[
  {
    "id": 501,
    "type": "credit_percentage", // e.g., discount, free_month
    "description": "1 Month Free Pro",
    "value": 100, // 100% off
    "redeemed": false,
    "expires_at": "2025-12-31"
  }
]
```

**Redeem Reward**
- Endpoint: `POST /api/rewards/{reward_id}/redeem`
- Description: Applies a reward to the current subscription or account.

Response (200 OK):
```json
{
  "message": "Reward applied. Your next billing cycle will be free.",
  "redeemed_at": "2025-01-15"
}
```
