#ifndef CONFIG_H
#define CONFIG_H

// -- GPRS Configuration --
// Replace with your mobile carrier's APN
#define GPRS_APN "YOUR_APN"
#define GPRS_USER ""
#define GPRS_PASS ""


// -- MQTT Configuration --
// Replace with your HiveMQ Cluster URL, Port, Username, and Password
#define MQTT_BROKER "5fac3f84f07f47cf9aab783573d2381d.s1.eu.hivemq.cloud"
#define MQTT_PORT 8883
#define MQTT_USERNAME "espmodmqtt"
#define MQTT_PASSWORD "Espmod800485"

#define MQTT_TOPIC_LOGS "vfd/logs"

// -- WiFi Configuration --
// Replace with your WiFi SSID and Password
#define WIFI_SSID "espmodbustru_test_network"
#define WIFI_PASSWORD "Myesp@123"

// -- Relay Configuration --
#define RELAY_PIN_1 14 // Connected to IN1
#define RELAY_PIN_2 12 // Connected to IN2
#define RELAY_PIN_3 32 // Connected to IN3
#define RELAY_PIN_4 33 // Connected to IN4

#endif // CONFIG_H
