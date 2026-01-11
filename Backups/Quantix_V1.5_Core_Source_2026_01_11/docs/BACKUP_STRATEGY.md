# Database Backup Strategy

## Supabase Auto-Backup ✅

Supabase automatically provides:
- **Daily backups** (retained for 7 days on free tier)
- **Point-in-time recovery** (upgrade required)
- **Automatic replication** across availability zones

## Manual Backup Script (Future)

When we have 5-year historical data, run this weekly:

```javascript
// scripts/backup-database.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function backupSignals() {
  const { data, error } = await supabase
    .from('ai_signals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `ai_signals_backup_${timestamp}.json`;
  
  fs.writeFileSync(
    path.join('backups', filename),
    JSON.stringify(data, null, 2)
  );

  console.log(`✅ Backup saved: ${filename}`);
  console.log(`📊 Total signals: ${data.length}`);
}

backupSignals();
```

## Backup Schedule (Recommended)

- **Daily**: Automatic (Supabase)
- **Weekly**: Manual export to JSON (when data grows)
- **Monthly**: Archive to Google Drive/Dropbox

## Recovery Time Objective (RTO)

- Database failure: < 5 minutes (Supabase auto-recovery)
- Complete data loss: < 30 minutes (restore from backup)
