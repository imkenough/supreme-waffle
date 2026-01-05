/*
  ESP32 VFD Controller for Mitsubishi FR-E700 via SIM800C GPRS and MQTT
  
  This program uses a SIM800C GPRS module to connect to an MQTT broker,
  allowing remote control of a Mitsubishi FR-E700 VFD.

  ARCHITECTURE:
  - The ESP32 connects to the internet via a SIM800C GPRS module.
  - It then connects to an MQTT broker.
  - It subscribes to a "control" topic to receive commands (e.g., start, stop, set frequency).
  - It periodically reads the VFD status and publishes it to a "status" topic.
  - The web frontend application also connects to the same MQTT broker to send commands and receive status updates.

  HARDWARE CONNECTIONS:
  ---------------------
  ESP32 -> MAX485 Module
  - GPIO 27 (TX1) -> DI
  - GPIO 26 (RX1) -> RO
  - GPIO 25       -> DE/RE

  ESP32 -> SIM800C Module
  - GPIO 17 (TX2) -> SIM800C RXD
  - GPIO 16 (RX2) -> SIM800C TXD
  - GND           -> GND
  - 5V External   -> VCC (ensure sufficient power, e.g., 2A)

  MAX485 Module -> FR-E700 VFD
  - A -> VFD Port A / SDA+
  - B -> VFD Port B / SDB-
  
  LIBRARY DEPENDENCIES:
  ---------------------
  - TinyGsmClient by Volodymyr Shymanskyy
  - PubSubClient by Nick O'Leary
  - ModbusMaster by Doc Walker
  - ArduinoJson by Benoit Blanchon

  Install these from the Arduino Library Manager.
*/

#include "config.h"

// --- GPRS and MQTT Configuration ---
const char apn[] = GPRS_APN;
const char gprsUser[] = GPRS_USER;    
const char gprsPass[] = GPRS_PASS;    

const char* mqtt_broker = MQTT_BROKER;
const int mqtt_port = MQTT_PORT;
const char* mqtt_username = MQTT_USERNAME;
const char* mqtt_password = MQTT_PASSWORD;
const char* mqtt_topic_control = "vfd/control";
const char* mqtt_topic_status = "vfd/status";

// Define the serial port for the SIM800C
#define SerialAT Serial2

// --- Modbus RTU Configuration ---
#define MAX485_DE_RE_PIN 25
#define VFD_SLAVE_ID 1

// Modbus registers (verify with manual)
#define REG_CONTROL         8
#define REG_SET_FREQUENCY   14
#define REG_OUTPUT_FREQ     201
#define REG_OUTPUT_CURRENT  202
#define REG_OUTPUT_VOLTAGE  203
#define REG_MOTOR_STATUS    200 // Example: may contain running status
#define REG_FAULT_HISTORY   993

// Modbus commands
#define CMD_STOP            0
#define CMD_RUN_FORWARD     2

#include <TinyGsmClient.h>
#include <PubSubClient.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>

// --- Globals ---
TinyGsm modem(SerialAT);
TinyGsmClient gsmClient(modem);
PubSubClient mqttClient(gsmClient);
ModbusMaster node;

unsigned long lastStatusPublish = 0;
const long statusPublishInterval = 5000; // Publish status every 5 seconds

void preTransmission() {
  digitalWrite(MAX485_DE_RE_PIN, HIGH);
}

void postTransmission() {
  digitalWrite(MAX485_DE_RE_PIN, LOW);
}

void setup_gprs() {
  Serial.println("Initializing modem...");
  SerialAT.begin(115200, SERIAL_8N1, 16, 17);
  delay(6000);
  modem.restart();

  Serial.println("Waiting for network...");
  if (!modem.waitForNetwork()) {
    Serial.println(" failed to connect to network. Retrying...");
    delay(10000);
    ESP.restart();
  }

  Serial.println("Connecting to GPRS...");
  if (!modem.gprsConnect(apn, gprsUser, gprsPass)) {
    Serial.println(" failed to connect to GPRS. Retrying...");
    delay(10000);
    ESP.restart();
  }
  Serial.println("GPRS connected");
}

void mqtt_callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  
  char message[length + 1];
  memcpy(message, payload, length);
  message[length] = '\0';
  Serial.println(message);

  StaticJsonDocument<200> doc;
  deserializeJson(doc, message);

  const char* command = doc["command"];

  if (strcmp(command, "start") == 0) {
    node.writeSingleRegister(REG_CONTROL, CMD_RUN_FORWARD);
  } else if (strcmp(command, "stop") == 0 || strcmp(command, "emergency_stop") == 0) {
    node.writeSingleRegister(REG_CONTROL, CMD_STOP);
  } else if (strcmp(command, "set_frequency") == 0) {
    float frequency = doc["frequency"];
    if (frequency >= 0 && frequency <= 60) {
      node.writeSingleRegister(REG_SET_FREQUENCY, (uint16_t)(frequency * 100));
    }
  }
}

void mqtt_reconnect() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "esp32-vfd-client-";
    clientId += String(random(0xffff), HEX);
    if (mqttClient.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("connected");
      mqttClient.subscribe(mqtt_topic_control);
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(MAX485_DE_RE_PIN, OUTPUT);
  digitalWrite(MAX485_DE_RE_PIN, LOW);

  // --- Modbus Setup ---
  Serial1.begin(9600, SERIAL_8E1, 26, 27);
  node.begin(VFD_SLAVE_ID, Serial1);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);

  setup_gprs();
  
  mqttClient.setServer(mqtt_broker, mqtt_port);
  mqttClient.setCallback(mqtt_callback);
}

void publishStatus() {
  StaticJsonDocument<256> doc;
  uint8_t result;

  // Read data from VFD
  result = node.readHoldingRegisters(REG_OUTPUT_FREQ, 1);
  doc["frequency"] = (result == node.ku8MBSuccess) ? node.getResponseBuffer(0) / 100.0 : 0;
  
  result = node.readHoldingRegisters(REG_OUTPUT_CURRENT, 1);
  doc["current"] = (result == node.ku8MBSuccess) ? node.getResponseBuffer(0) / 100.0 : 0;
  
  result = node.readHoldingRegisters(REG_OUTPUT_VOLTAGE, 1);
  doc["voltage"] = (result == node.ku8MBSuccess) ? node.getResponseBuffer(0) / 10.0 : 0;

  result = node.readHoldingRegisters(REG_MOTOR_STATUS, 1);
  doc["motorState"] = (result == node.ku8MBSuccess && node.getResponseBuffer(0) != 0) ? "Running" : "Stopped";
  
  doc["vfd_responding"] = (result == node.ku8MBSuccess);

  // You need to implement logic to calculate RPM based on frequency and motor poles
  doc["rpm"] = (doc["frequency"] > 0) ? (int)((doc["frequency"].as<float>() / 60.0) * 3600 / 2) : 0; // Example for 2-pole motor

  result = node.readHoldingRegisters(REG_FAULT_HISTORY, 1);
  doc["fault"] = (result == node.ku8MBSuccess) ? String(node.getResponseBuffer(0)) : "N/A";

  char buffer[256];
  serializeJson(doc, buffer);
  mqttClient.publish(mqtt_topic_status, buffer);
  Serial.print("Published status: ");
  Serial.println(buffer);
}

void loop() {
  if (!mqttClient.connected()) {
    mqtt_reconnect();
  }
  mqttClient.loop();

  unsigned long now = millis();
  if (now - lastStatusPublish > statusPublishInterval) {
    lastStatusPublish = now;
    publishStatus();
  }
}
