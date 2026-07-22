# PriceWatch — Bot specification

**Archetype:** finance

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

PriceWatch is a personal Telegram bot that lets users maintain private watchlists of crypto tickers and receive alerts for price thresholds or percent changes. Users can query prices, set quiet hours, and schedule daily summaries, while the owner can view usage metrics and top alerting tickers.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- individual crypto traders
- casual crypto holders

## Success criteria

- users receive accurate price alerts based on their rules
- admin can view usage metrics and top tickers
- users can manage watchlists and alert settings without errors

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open the main menu and create default watchlist with BTC, ETH, TON and a sample percent alert
- **/price** (command, actor: user, command: /price) — Query current price(s) for a specific ticker or all watchlist items
- **/admin** (command, actor: owner, command: /admin) — Owner-only command to view total users, active watchlists, and top 10 alerting tickers
- **Manage Watchlist** (button, actor: user, callback: watchlist:manage) — Open watchlist management menu with Add, Remove, and View options
- **Add Alert** (button, actor: user, callback: alert:add) — Start the alert creation flow for a selected ticker
- **Edit Alerts** (button, actor: user, callback: alert:edit) — View and modify existing alert rules with inline edit/remove buttons
- **Set Quiet Hours** (button, actor: user, callback: quiet_hours:set) — Configure quiet hours to suppress alerts during specified time periods
- **Schedule Morning Summary** (button, actor: user, callback: summary:schedule) — Enable and set the time for a daily morning summary of prices and alerts

## Flows

### Onboarding
_Trigger:_ /start

1. Display welcome message with feature overview
2. Create default watchlist with BTC, ETH, TON
3. Set up sample percent alert for one of the default tickers
4. Open main menu with watchlist and alert options

_Data touched:_ User profile, Watchlist item, Alert rule

### Manage Watchlist
_Trigger:_ watchlist:manage

1. Display current watchlist items with inline buttons
2. Offer Add, Remove, and View options
3. For Add: prompt for ticker symbol and optional name
4. For Remove: confirm deletion of selected item
5. For View: show detailed information about each watchlist item

_Data touched:_ Watchlist item

### Add Alert
_Trigger:_ alert:add

1. Select ticker from watchlist
2. Choose alert type (Threshold or Percent)
3. Enter threshold value ($ or %) and direction
4. Set alert name and description
5. Confirm and save alert rule

_Data touched:_ Alert rule

### Edit Alerts
_Trigger:_ alert:edit

1. List all active alert rules with inline edit/remove buttons
2. For Edit: update threshold, direction, or enable/disable status
3. For Remove: confirm deletion of selected alert

_Data touched:_ Alert rule

### Price Query
_Trigger:_ /price

1. Parse ticker parameter (or 'all')
2. Fetch current price and 1h percent change
3. Display price information with error handling for unknown tickers
4. Offer to add unknown ticker to watchlist or suggest corrections

_Data touched:_ Watchlist item, Alert event log

### Morning Summary
_Trigger:_ summary:schedule

1. Prompt for preferred local time
2. Confirm and save schedule
3. Generate and send daily summary at scheduled time with prices and suppressed alerts

_Data touched:_ User profile

### Quiet Hours
_Trigger:_ quiet_hours:set

1. Prompt for start and end times
2. Confirm and save quiet hours settings
3. Display current quiet hours configuration

_Data touched:_ User profile

### Alert Delivery
_Trigger:_ price update event

1. Check if price meets alert conditions
2. Verify if alert is enabled and not in cooldown
3. Check if current time is outside quiet hours
4. Generate alert message with all required details
5. Mark alert as delivered and apply cooldown
6. Log event in alert event log

_Data touched:_ Alert rule, Alert event log

### Admin View
_Trigger:_ /admin

1. Verify owner identity
2. Fetch and display total users
3. Fetch and display active watchlists
4. Fetch and display top 10 alerting tickers by count

_Data touched:_ User profile, Alert event log

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User profile** _(retention: persistent)_ — Stores user-specific settings including watchlist, alert rules, quiet hours, morning-summary time, and cooldown settings
  - fields: user_id, watchlist, alert_rules, quiet_hours_start, quiet_hours_end, morning_summary_time, cooldown_duration
- **Watchlist item** _(retention: persistent)_ — Represents a cryptocurrency ticker in the user's watchlist with optional name
  - fields: ticker, name
- **Alert rule** _(retention: persistent)_ — Defines a price alert condition including type, parameters, enabled status, and last-fired timestamp
  - fields: user_id, ticker, alert_type, threshold_value, direction, enabled, last_fired
- **Alert event log** _(retention: persistent)_ — Records each alert event including user, ticker, old price, new price, percent change, timestamp, and delivery status
  - fields: user_id, ticker, old_price, new_price, percent_change, timestamp, delivered

## Integrations

- **Telegram** (required) — Bot API messaging for user alerts, /price responses, and admin commands
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- /admin command to view metrics
- Access to price feed configuration
- Ability to set global cooldown or maintenance mode

## Notifications

- Price threshold alerts
- Percent change alerts
- Morning summary notifications
- Service status warnings for failed price fetches

## Permissions & privacy

- All user data is private and not shared with third parties
- Alert logs are stored securely and only accessible to the user and owner
- User can delete their data at any time

## Edge cases

- Handling unknown tickers with helpful suggestions
- Managing alerts during quiet hours with suppression and summary
- Handling price feed failures with retry logic and service warnings
- Preventing alert spam through cooldown periods

## Required tests

- Verify alert delivery with correct parameters and cooldown behavior
- Test quiet hours suppression and morning summary inclusion
- Validate price query responses for known and unknown tickers
- Confirm admin metrics display accurate data

## Assumptions

- Users will provide valid ticker symbols when adding to watchlist
- Price feed will be available for most tickers
- Users will understand the 1-hour percent change window
- Owner will maintain the price feed integration
