import * as mqtt from "mqtt";
import { HueState, SleepAsAndroidEvent, State } from "./types";
import dotenv from "dotenv";
import { stat } from "fs";
import * as jp from "jsonpath";

dotenv.config();

const kitchenSwitchTopic = "zigbee2mqtt/switch_kitchen_1/action";
const kitchenLampTopic = "zigbee2mqtt/lamp_kitchen_1/set";
const bedroomLampTopic = "zigbee2mqtt/lamp_bedroom_1/set";
const livingRoomLampTopic = "zigbee2mqtt/lamp_living_room_1/set";
const livingRoomSwitchTopic = "zigbee2mqtt/switch_living_room_1/action";
const sleepAsAndroidTopic = "SleepAsAndroid";

// Smarthome bridge
const bridgeBrightnessLivingRoomTopic = "smarthome/lamp_living_room_1/brightness";
const bridgeColorTempLivingRoomTopic = "smarthome/lamp_living_room_1/color_temp";
const bridgeColorHexLivingRoomTopic = "smarthome/lamp_living_room_1/color_hex";


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
subscribe(livingRoomSwitchTopic);

bridgeJsonToPlaintextTopic(livingRoomLampTopic, bridgeBrightnessLivingRoomTopic, "$.brightness");
bridgePlaintextToJsonTopic(bridgeBrightnessLivingRoomTopic, livingRoomLampTopic, "brightness", { transition: 1 });
bridgeJsonToPlaintextTopic(livingRoomLampTopic, bridgeColorTempLivingRoomTopic, "$.color_temp");
bridgePlaintextToJsonTopic(bridgeColorTempLivingRoomTopic, livingRoomLampTopic, "color_temp", { transition: 1 });
bridgeJsonToPlaintextTopic(livingRoomLampTopic, bridgeColorHexLivingRoomTopic, "$.color.hex");
bridgePlaintextToJsonTopic(bridgeColorHexLivingRoomTopic, livingRoomLampTopic, "color.hex", { transition: 1 });

client.on("message", (topic, payload) => {
    console.trace(`Received Message: '${topic}' with '${payload}'`);

    // If we toggled the lamp manually, there is nothing left to do
    if (topic === bedroomLampTopic) {
        resetTimeout();
    } 
    else if (topic === sleepAsAndroidTopic) {
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
    else if (topic === kitchenSwitchTopic) {
        const state = payload.toString().toUpperCase() as State;
        const desiredLampState = { state };
        client.publish(kitchenLampTopic, JSON.stringify(desiredLampState));
    }
    else if (topic === livingRoomSwitchTopic) {
        const state = payload.toString().toUpperCase() as HueState;
        handleHueSwitch(state);
    }
    else {
        console.trace(`No mapping found for topic '${topic}'`);
    }
});

function handleHueSwitch(state: HueState) {
    const stateToggles: HueState[] = ["ON_PRESS", "ON_HOLD", "OFF_PRESS", "OFF_HOLD"];
    const brightnessToggles: HueState[] = ["UP_PRESS", "DOWN_PRESS"];
    const brightnessMoveStart: HueState[] = ["UP_HOLD", "DOWN_HOLD"];
    const brightnessMoveStop: HueState[] = ["UP_HOLD_RELEASE", "DOWN_HOLD_RELEASE"];

    let desiredState = {};

    if (stateToggles.includes(state)) {
        desiredState = {
            state: "TOGGLE"
        };
    }
    else if (brightnessToggles.includes(state)) {
        const stepSize = 25;
        desiredState = {
            "brightness_step": state.startsWith("UP") ? stepSize : 0 - stepSize,
            transition: 1
        }
    } else if (brightnessMoveStart.includes(state)) {
        const stepSize = 25;
        desiredState = {
            "brightness_move": state.startsWith("UP") ? stepSize : 0 - stepSize
        }
    } else if (brightnessMoveStop.includes(state)) {
        desiredState = {
            "brightness_move": 0
        }
    }
    client.publish(livingRoomLampTopic, JSON.stringify(desiredState));
}

function bridgeJsonToPlaintextTopic(subTopic: string, pubTopic: string, jsonPath: string) {
    client.subscribe(subTopic);
    client.on("message", (topic, payload) => {
        if (topic !== subTopic) return;

        const jsonPayload = JSON.parse(payload.toString());
        const res = jp.query(jsonPayload, jsonPath);
        if (res.length === 0) {
            console.warn(`No result found. topic: '%s', path: '%s'`, subTopic, jsonPath);
            return;
        }
        if (res.length > 1) {
            console.warn(`Received more results than expected. Defaulting to first. topic: '%s', path: '%s', results: '%O'`, subTopic, jsonPath, res);
        }

        const extracted = res[0];
        client.publish(pubTopic, extracted);
    });
}

function bridgePlaintextToJsonTopic(subTopic: string, pubTopic: string, property: string, additionalProps?: any) {
    client.subscribe(subTopic);
    client.on("message", (topic, payload) => {
        if (topic !== subTopic) return;

        const jsonPayload = {
            ...additionalProps
        };

        const set = (obj: any, path: string, val: any) => { 
            const keys = path.split('.');
            const lastKey = keys.pop()!;
            const lastObj = keys.reduce((obj, key) => 
                obj[key] = obj[key] || {}, 
                obj); 
            lastObj[lastKey] = val;
        };  
        set(jsonPayload, property, payload);

        client.publish(pubTopic, JSON.stringify(jsonPayload));
    });
}