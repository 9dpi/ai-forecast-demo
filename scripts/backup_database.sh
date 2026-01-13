#!/bin/bash
# Quantix AI - Database Backup Script
# Created: 2026-01-13
# Purpose: Export critical tables before service restructuring

echo "🗄️ Starting Quantix Database Backup..."
echo "Timestamp: $(date)"

# Export pattern_cache table
echo "📊 Exporting pattern_cache..."
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -t pattern_cache --data-only --column-inserts > RecoveryVault/backup_pattern_cache_$(date +%Y%m%d).sql

# Export ai_signals table
echo "📊 Exporting ai_signals..."
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -t ai_signals --data-only --column-inserts > RecoveryVault/backup_ai_signals_$(date +%Y%m%d).sql

echo "✅ Backup completed successfully!"
echo "Files saved to RecoveryVault/"
