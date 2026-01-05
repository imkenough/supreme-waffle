#define CONFIG_H
#define CONFIG_H

// -- GPRS Configuration --
// Replace with your mobile carrier's APN
#define GPRS_APN "YOUR_APN"
#define GPRS_USER ""
#define GPRS_PASS ""


// -- MQTT Configuration --
// Replace with your HiveMQ Cluster URL, Port, Username, and Password
#define MQTT_BROKER "your-cluster-url.s1.eu.hivemq.cloud"
#define MQTT_PORT 1883
#define MQTT_USERNAME "espmodmqtt"
#define MQTT_PASSWORD "Espmod800485"


#endif // CONFIG_H
