import * as mqtt from "mqtt";
import { SleepAsAndroidEvent, State } from "./types";
import dotenv from "dotenv";

dotenv.config();

const kitchenSwitchTopic = "zigbee2mqtt/switch_kitchen_1/action";
const kitchenLampTopic = "zigbee2mqtt/lamp_kitchen_1/set";
const bedroomLampTopic = "zigbee2mqtt/lamp_bedroom_1/set";
const sleepAsAndroidTopic = "SleepAsAndroid";
const client = mqtt.connect(`mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`);
let timeoutId: ReturnType<typeof setTimeout> | null = null;

const turnAllTheLightsOn = () => {
    const stateOn = {
        state: "ON",
        brightness: 150,
        transition: 90
    };
    client.publish(bedroomLampTopic, JSON.stringify(stateOn));
};

const turnAllTheLightsOff = () => {
    const stateOff = {
        state: "OFF"
    };
    client.publish(bedroomLampTopic, JSON.stringify(stateOff));
};

const resetTimeout = () => {
    if (timeoutId) clearTimeout(timeoutId);
};

const subscribe = (topic: string) => {
    client.subscribe(topic, (err) => {
        if (!err) {
            console.log(`Successfully subscribed to topic '${topic}'`);
        } else {
            console.error(err);
            console.error(`Could not subscribe to topic '${topic}'`);
        }
    });
}

client.on("error", (err) => {
    console.error("Could not connect to MQTT Broker:", err);
});

client.on("connect", () => {
    console.log("Successfully connected to MQTT Broker");
});

subscribe(sleepAsAndroidTopic);
subscribe(bedroomLampTopic);
subscribe(kitchenSwitchTopic);

client.on("message", (topic, payload) => {
    console.trace(`Received Message: '${topic}' with '${payload}'`);

    // If we toggled the lamp manually, there is nothing left to do
    if (topic === bedroomLampTopic) {
        resetTimeout();
    }

    if (topic === sleepAsAndroidTopic) {
        const event = JSON.parse(payload.toString()) as SleepAsAndroidEvent;
        if(event.event == "alarm_alert_start") {
            turnAllTheLightsOn();
        }

        if(event.event == "alarm_alert_dismiss") {
            resetTimeout();

            // Time to wake up otherwise turn the lights off
            timeoutId = setTimeout(turnAllTheLightsOff, 15 * 60 * 1000);
        }
    }

    if (topic === kitchenLampTopic) {
        const state = payload.toString().toUpperCase() as State;
        const desiredLampState = { state };
        client.publish(kitchenLampTopic, JSON.stringify(desiredLampState));
    }
});
