#!/bin/bash
# Credit Card Scraper Cron Runner
# Run this script periodically to update credit card data
# 
# Setup cron job:
#   crontab -e
#   # Run daily at 6 AM
#   0 6 * * * /path/to/scraper-cron.sh
# 
# Or run manually:
#   ./scraper-cron.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Set environment variables if .env exists
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Log file
LOG_FILE="scraper.log"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Start
log "========================================="
log "Starting Credit Card Scraper Cron Job"
log "========================================="

# Run the scraper
node scraper.js >> "$LOG_FILE" 2>&1

# Check if successful
if [ $? -eq 0 ]; then
    log "✓ Scraper completed successfully"
else
    log "✗ Scraper failed with exit code $?"
fi

log "========================================="
log "Cron job finished"
log "========================================="
