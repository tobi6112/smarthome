import * as mqtt from "mqtt";
import { SleepAsAndroidEvent } from "./types";
import dotenv from "dotenv";

dotenv.config();

const client = mqtt.connect(`mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`);
let timeoutId: ReturnType<typeof setTimeout> | null = null;

const turnAllTheLightsOn = () => {
    const stateOn = {
        state: "ON",
        brightness: 100,
        transition: 90
    };
    client.publish("zigbee2mqtt/lamp_bedroom_1/set", JSON.stringify(stateOn));
};

const turnAllTheLightsOff = () => {
    const stateOff = {
        state: "OFF",
        brightness: 0
    };
    client.publish("zigbee2mqtt/lamp_bedroom_1/set", JSON.stringify(stateOff));
};

client.on("error", (err) => {
    console.error(`Could not connect to MQTT Broker: ${err}`);
});

client.on("connect", () => {
    console.log("Successfully connected to MQTT Broker");
});

client.subscribe("SleepAsAndroid", (err) => {
    if(!err) {
        console.log("Successfully subscribed to SleepAsAndroid Topic");
    } else {
        console.error(err);
        console.error("Could not subscribe to SleepAsAndroid Topic");
    }
});

client.on("message", (topic, payload) => {
    console.log(`Recieved Message: '${topic}' with '${payload}'`);
    if(topic === "SleepAsAndroid") {
        const event = JSON.parse(payload.toString()) as SleepAsAndroidEvent;
        if(event.event == "alarm_alert_start") {
            turnAllTheLightsOn();
        }

        if(event.event == "alarm_alert_dismiss") {
            if(timeoutId) clearTimeout(timeoutId);

            // 10 Minutes to wake up
            timeoutId = setTimeout(turnAllTheLightsOff, 10 * 60 * 1000);
        }
    }
});
