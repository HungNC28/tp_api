import { SensorNS } from "./sensor";

const ValueAdjust = {
    // Song May do tham 1
    '3NP7U757': {
        WP1: 16.5,
        WP2: 18.2,
        WP3: 14.2,
    },

    // Song May do tham 2
    'JVPRAJG1': {
        WP1: 16.9,
        WP2: 17.5,
        WP3: 14.5,
    },

    // Song May do tham 3
    '9XHUR90X': {
        WP1: 17.5,
        WP2: 18.5,
        WP3: 14.5,
    }
}

export function AdjustSensorRecord(box_id: string, record: SensorNS.Record) {
    const adjustments = ValueAdjust[box_id];
    if (adjustments) {
        for (const k in adjustments) {
            record[k] = record[k] + adjustments[k];
        }
    }
}
