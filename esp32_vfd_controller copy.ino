// copy of ver 1

/*
  ESP32 VFD Controller for Mitsubishi FR-E700
  
  This program creates a web server on the ESP32 that allows you to control
  a Mitsubishi FR-E700 Variable Frequency Drive (VFD) using Modbus RTU
  communication over RS-485. It uses a MAX485 module to interface with the VFD.

  HARDWARE CONNECTIONS:
  ---------------------
  ESP32 -> MAX485 Module
  - GPIO 17 (TX2) -> DI (Driver Input)
  - GPIO 16 (RX2) -> RO (Receiver Output)
  - GPIO 4        -> DE/RE (Driver/Receiver Enable)

  MAX485 Module -> FR-E700 VFD
  - A -> VFD Port A / SDA+
  - B -> VFD Port B / SDB-

  FR-E700 VFD SETTINGS:
  ---------------------
  - Pr. 117: Station Address (e.g., 1)
  - Pr. 118: Communication Speed (e.g., 96 for 9600 bps)
  - Pr. 119: Stop Bit/Parity (e.g., 0 for 8-bit, 1 stop bit, no parity)
  - Pr. 120: Protocol (e.g., 1 for Modbus RTU)
  - Pr. 340: Communication operation mode selection (e.g., 2 for NET mode)
  - Pr. 549: Communication startup mode selection (e.g., 2 for NET mode)
  
  Make sure to verify these settings in the FR-E700 manual.

  API ENDPOINTS:
  --------------
  - GET /status: Returns the current status of the VFD (frequency, current, voltage, fault).
  - POST /control: Sends a command to the VFD.
    - JSON Body:
      {
        "command": "start" | "stop" | "set_frequency",
        "frequency": <number> // Required for "set_frequency"
      }
*/

#include <WiFi.h>
#include <WebServer.h>
#include <ModbusMaster.h>

// --- Wi-Fi Configuration ---
const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

// --- Modbus RTU Configuration ---
#define MAX485_DE_RE_PIN 25
#define VFD_SLAVE_ID 1

// Modbus registers for FR-E700 (verify with manual)
#define REG_CONTROL         8
#define REG_SET_FREQUENCY   14
#define REG_OUTPUT_FREQ     201
#define REG_OUTPUT_CURRENT  202
#define REG_OUTPUT_VOLTAGE  203
#define REG_FAULT_HISTORY   993 // Example for fault, might be different

// Modbus commands
#define CMD_STOP            0
#define CMD_RUN_FORWARD     2

// --- Globals ---
WebServer server(80);
ModbusMaster node;

void preTransmission() {
  digitalWrite(MAX485_DE_RE_PIN, HIGH);
}

void postTransmission() {
  digitalWrite(MAX485_DE_RE_PIN, LOW);
}

void setup() {
  Serial.begin(115200);
  pinMode(MAX485_DE_RE_PIN, OUTPUT);
  digitalWrite(MAX485_DE_RE_PIN, LOW);

  // --- Connect to Wi-Fi ---
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // --- Modbus Setup ---
  // Use Serial1 for ESP32, with pins 26 (RX) and 27 (TX)
  Serial1.begin(9600, SERIAL_8E1, 26, 27); // Match VFD settings
  node.begin(VFD_SLAVE_ID, Serial1);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);

  // --- Web Server Setup ---
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/control", HTTP_POST, handleControl);
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
}

void handleStatus() {
  uint8_t result;
  String response = "{";

  // Read Output Frequency
  result = node.readHoldingRegisters(REG_OUTPUT_FREQ, 1);
  if (result == node.ku8MBSuccess) {
    float freq = node.getResponseBuffer(0) / 100.0;
    response += "\"frequency\": " + String(freq, 2);
  } else {
    response += "\"frequency\": null";
  }

  // Read Output Current
  result = node.readHoldingRegisters(REG_OUTPUT_CURRENT, 1);
  if (result == node.ku8MBSuccess) {
    float current = node.getResponseBuffer(0) / 100.0;
    response += ", \"current\": " + String(current, 2);
  } else {
    response += ", \"current\": null";
  }

  // Read Output Voltage
  result = node.readHoldingRegisters(REG_OUTPUT_VOLTAGE, 1);
  if (result == node.ku8MBSuccess) {
    float voltage = node.getResponseBuffer(0) / 10.0;
    response += ", \"voltage\": " + String(voltage, 1);
  } else {
    response += ", \"voltage\": null";
  }
  
  // Read Fault History (example)
  result = node.readHoldingRegisters(REG_FAULT_HISTORY, 1);
  if (result == node.ku8MBSuccess) {
    int fault = node.getResponseBuffer(0);
    response += ", \"fault\": " + String(fault);
  } else {
    response += ", \"fault\": null";
  }
  
  response += "}";
  server.send(200, "application/json", response);
}

void handleControl() {
  if (!server.hasArg("plain")) {
    server.send(400, "text/plain", "Body not found");
    return;
  }
  String body = server.arg("plain");

  // For simplicity, we'll parse the JSON manually.
  // A library like ArduinoJson is recommended for more complex parsing.
  String command = "";
  float frequency = 0.0;
  
  if (body.indexOf("\"command\": \"start\"") != -1) {
    command = "start";
  } else if (body.indexOf("\"command\": \"stop\"") != -1) {
    command = "stop";
  } else if (body.indexOf("\"command\": \"set_frequency\"") != -1) {
    command = "set_frequency";
    int freqIndex = body.indexOf("\"frequency\":");
    if (freqIndex != -1) {
      int startIndex = freqIndex + 12;
      int endIndex = body.indexOf(",", startIndex);
      if (endIndex == -1) {
        endIndex = body.indexOf("}", startIndex);
      }
      String freqStr = body.substring(startIndex, endIndex);
      frequency = freqStr.toFloat();
    }
  }

  uint8_t result = node.ku8MBSlaverequestError;

  if (command == "start") {
    result = node.writeSingleRegister(REG_CONTROL, CMD_RUN_FORWARD);
  } else if (command == "stop") {
    result = node.writeSingleRegister(REG_CONTROL, CMD_STOP);
  } else if (command == "set_frequency" && frequency > 0) {
    uint16_t freqInt = frequency * 100;
    result = node.writeSingleRegister(REG_SET_FREQUENCY, freqInt);
  }

  if (result == node.ku8MBSuccess) {
    server.send(200, "application/json", "{\"status\": \"success\"}");
  } else {
    server.send(500, "application/json", "{\"status\": \"error\", \"code\": " + String(result) + "}");
  }
}
