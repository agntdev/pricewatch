export interface WatchlistItem {
  ticker: string;
  name?: string;
}

export interface AlertRule {
  id: string;
  ticker: string;
  alertType: "threshold" | "percent";
  thresholdValue: number;
  direction: "above" | "below";
  enabled: boolean;
  name?: string;
  lastFired?: number;
}

export interface AlertEvent {
  userId: number;
  ticker: string;
  oldPrice: number;
  newPrice: number;
  percentChange: number;
  timestamp: number;
  delivered: boolean;
}

export type FlowStep =
  | "idle"
  | "add_ticker"
  | "add_name"
  | "alert_ticker"
  | "alert_type"
  | "alert_value"
  | "alert_direction"
  | "alert_name"
  | "alert_confirm"
  | "edit_alert_pick"
  | "edit_alert_field"
  | "remove_alert_confirm"
  | "remove_watchlist_confirm"
  | "quiet_start"
  | "quiet_end"
  | "summary_time";

export interface Session {
  watchlist: WatchlistItem[];
  alerts: AlertRule[];
  quietHoursStart?: string;
  quietHoursEnd?: string;
  morningSummaryTime?: string;
  cooldownDuration: number;
  step: FlowStep;
  flowData: Record<string, unknown>;
  onboarded: boolean;
}
