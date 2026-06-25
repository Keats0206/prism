# Mutual SMS Agent — Friend Test Guide

## Setup checklist

1. **Supabase**: Create a project, run `supabase/migrations/001_initial.sql` in the SQL editor.
2. **Twilio**: Use a toll-free number (844/888/etc.), complete Toll-Free Verification, set inbound webhook to `https://www.rlylabs.com/api/sms/inbound` (POST — use `www`, apex redirects).
3. **Env vars**: Copy `.env.example` → `.env.local` and fill in all values.
4. **Deploy**: Push to Vercel (or run locally with `ngrok http 3000` + Twilio webhook pointing to ngrok URL).
5. **Local dev**: Set `TWILIO_SKIP_SIGNATURE_VALIDATION=true` when tunneling.

## Onboarding friends (~10 people)

Share the Twilio number and this script:

> Text **[number]** to try Mutual — an SMS agent that helps you coordinate plans with friends. Try: "Help me plan drinks with [friend name] this weekend."

Ask each friend to:
1. Text their name when prompted
2. Add one contact: "Add Alex 555-123-4567"
3. Run one coordinate flow end-to-end
4. Approve a draft with YES

## Success metrics (track in Supabase)

Run these queries in the Supabase SQL editor during the 1-week test:

### Messages per user
```sql
select u.name, u.phone, count(m.id) as message_count
from users u
join threads t on t.owner_user_id = u.id and t.kind = 'owner'
join messages m on m.thread_id = t.id
group by u.id, u.name, u.phone
order by message_count desc;
```

### Pending action approval rate
```sql
select
  status,
  count(*) as count,
  round(100.0 * count(*) / sum(count(*)) over (), 1) as pct
from pending_actions
group by status;
```

### Plans coordinated (executed sends)
```sql
select
  pa.created_at,
  u.name as owner,
  pa.payload->>'contactName' as contact,
  pa.payload->>'messageBody' as message
from pending_actions pa
join users u on u.id = pa.user_id
where pa.status = 'executed'
order by pa.created_at desc;
```

### Time to plan lock (manual)
Track from first `coordinate_plan` message to owner confirming a time — review `messages` table threads.

### START conversions (viral loop)
```sql
select count(*) as new_users_from_start
from users
where onboarded_at is not null
  and created_at > now() - interval '7 days';
```

## MVP pass criteria

- [ ] At least 3 real plans coordinated end-to-end via SMS
- [ ] Users approve and send drafted messages unprompted on day 2+
- [ ] A recipient texts START organically

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 403 Invalid signature | Set `TWILIO_SKIP_SIGNATURE_VALIDATION=true` locally, or ensure webhook URL matches exactly |
| No reply | Check Vercel logs / `npm run dev` console |
| LLM errors | Verify `AI_GATEWAY_API_KEY` is set |
| DB errors | Confirm migration ran and `SUPABASE_SERVICE_ROLE_KEY` is correct |
