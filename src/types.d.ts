export type SleepAsAndroidEventType = "alarm_alert_dismiss" | "alarm_alert_start";

export type SleepAsAndroidEvent = {
    value1?: string,
    value2?: string,
    event: SleepAsAndroidEventType
}