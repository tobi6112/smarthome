export type State = "ON" | "OFF";
export type HueState =
    | "ON_PRESS"
    | "ON_HOLD"
    | "ON_PRESS_RELEASE"
    | "ON_HOLD_RELEASE"
    | "OFF_PRESS"
    | "OFF_HOLD"
    | "OFF_PRESS_RELEASE"
    | "OFF_HOLD_RELEASE"
    | "UP_PRESS"
    | "UP_HOLD"
    | "UP_PRESS_RELEASE"
    | "UP_HOLD_RELEASE"
    | "DOWN_PRESS"
    | "DOWN_HOLD"
    | "DOWN_PRESS_RELEASE"
    | "DOWN_HOLD_RELEASE"
    | "RECALL_0"
    | "RECALL_1"

export type SleepAsAndroidEvent = SimpleEvent | AlarmSnoozeEvent | TimeToBedEvent | ShowSkipNextEvent | AlarmEvent;

export type SimpleEvent = {
    event: SoundEvent | SnoringEvent | ApneaEvent | AwakeEvent | SleepEvent | LullabyEvent | SleepTrackingEvent
};

export type SleepTrackingEvent = "sleep_tracking_started" | "sleep_tracking_stopped" | "sleep_tracking_paused" | "sleep_tracking_resumed";

/**
 * @param value1 UNIX timestamp of alarm state
 * @param value2 Alarm Label
 */
export type AlarmSnoozeEvent = {
    value1: Number,
    value2: string,
    event: "alarm_snooze_clicked" | "alarm_snooze_canceled"
};

/**
 * @param value1 UNIX timestamp of alarm state
 */
export type TimeToBedEvent = {
    value1: Number,
    event: "time_to_bed_alarm_alert"
};

/**
 * @param value1 UNIX timestamp of alarm state
 */
export type ShowSkipNextEvent = {
    value1: Number,
    event: "show_skip_next_alarm";
}

/**
 * @param value1 UNIX timestamp of alarm state
 * @param value2 Alarm Label
 */
export type AlarmEvent = {
    value1: Number,
    value2: string,
    event: "alarm_alert_start" | "alarm_alert_dismiss" | "alarm_skip_next" | "alarm_skip_next_alarm"
}
export type RemEvent = "rem";
export type SmartperiodEvent = "smart_period" | "before_smart_period";
export type LullabyEvent = "lullaby_start" | "lullaby_stop" | "lullaby_volume_down";
export type SleepEvent = "deep_sleep" | "light_sleep";
export type AwakeEvent = "awake" | "not_awake";
export type ApneaEvent = "apnea_alarm";
export type SnoringEvent = "antisnoring";
export type SoundEvent = "sound_event_snore" | "sound_event_talk" | "sound_event_cough" | "sound_event_baby" | "sound_event_laugh";