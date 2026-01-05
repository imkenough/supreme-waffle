/*
  ESP32 VFD Controller for Mitsubishi FR-E700 via SIM800C GPRS
  
  This program uses a SIM800C GPRS module to create a web server on the ESP32,
  allowing remote control of a Mitsubishi FR-E700 VFD using Modbus RTU.

  ** IMPORTANT NOTE ON GPRS SERVER **
  This code sets up the ESP32 as a web server accessible via the GPRS network.
  This may not work reliably due to mobile network restrictions like Carrier-Grade NAT (CG-NAT)
  and firewalls, which can prevent incoming connections. A more robust solution is to use
  an MQTT client on the ESP32 that connects to a cloud MQTT broker. The web application
  would then communicate with the ESP32 through the MQTT broker.

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
  - ModbusMaster by Doc Walker

  Install these from the Arduino Library Manager.
*/

// --- GPRS Configuration ---
const char apn[] = "YOUR_APN"; // Your carrier's APN
const char gprsUser[] = "";    // GPRS User, if required
const char gprsPass[] = "";    // GPRS Password, if required

// Define the serial port for the SIM800C
#define SerialAT Serial2

// --- Modbus RTU Configuration ---
#define MAX485_DE_RE_PIN 25
#define VFD_SLAVE_ID 1

// Modbus registers for FR-E700 (verify with manual)
#define REG_CONTROL         8
#define REG_SET_FREQUENCY   14
#define REG_OUTPUT_FREQ     201
#define REG_OUTPUT_CURRENT  202
#define REG_OUTPUT_VOLTAGE  203
#define REG_FAULT_HISTORY   993

// Modbus commands
#define CMD_STOP            0
#define CMD_RUN_FORWARD     2

#include <TinyGsmClient.h>
#include <ModbusMaster.h>

// --- Globals ---
TinyGsm modem(SerialAT);
TinyGsmClient client(modem);
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

  // --- Modbus Setup ---
  Serial1.begin(9600, SERIAL_8E1, 26, 27);
  node.begin(VFD_SLAVE_ID, Serial1);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);

  // --- GPRS Setup ---
  Serial.println("Initializing modem...");
  SerialAT.begin(115200, SERIAL_8N1, 16, 17);
  delay(6000);
  modem.restart();

  Serial.println("Waiting for network...");
  if (!modem.waitForNetwork()) {
    Serial.println(" failed to connect to network");
    while (true);
  }

  Serial.println("Connecting to GPRS...");
  if (!modem.gprsConnect(apn, gprsUser, gprsPass)) {
    Serial.println(" failed to connect to GPRS");
    while (true);
  }

  Serial.println("GPRS connected");
  Serial.print("IP address: ");
  Serial.println(modem.localIP());
}

void loop() {
  // Listen for incoming clients
  TinyGsmClient client = server.available();

  if (client) {
    String currentLine = "";
    while (client.connected()) {
      if (client.available()) {
        char c = client.read();
        if (c == '\n') {
          if (currentLine.length() == 0) {
            // Request is complete, we can process it
            // Simple request parsing
            if (request.startsWith("GET /status")) {
              handleStatus(client);
            } else if (request.startsWith("POST /control")) {
              // Read body
              String body = "";
              while(client.available()) {
                body += (char)client.read();
              }
              handleControl(client, body);
            } else {
              sendHttpError(client, 404, "Not Found");
            }
            break;
          } else {
            if (currentLine.startsWith("GET") || currentLine.startsWith("POST")) {
              request = currentLine;
            }
            currentLine = "";
          }
        } else if (c != '\r') {
          currentLine += c;
        }
      }
    }
    // Close the connection
    client.stop();
  }
}


void handleStatus(TinyGsmClient& client) {
  uint8_t result;
  String response = "{";

  result = node.readHoldingRegisters(REG_OUTPUT_FREQ, 1);
  response += "\"frequency\": " + (result == node.ku8MBSuccess ? String(node.getResponseBuffer(0) / 100.0, 2) : "null");
  
  result = node.readHoldingRegisters(REG_OUTPUT_CURRENT, 1);
  response += ", \"current\": " + (result == node.ku8MBSuccess ? String(node.getResponseBuffer(0) / 100.0, 2) : "null");

  result = node.readHoldingRegisters(REG_OUTPUT_VOLTAGE, 1);
  response += ", \"voltage\": " + (result == node.ku8MBSuccess ? String(node.getResponseBuffer(0) / 10.0, 1) : "null");
  
  result = node.readHoldingRegisters(REG_FAULT_HISTORY, 1);
  response += ", \"fault\": " + (result == node.ku8MBSuccess ? String(node.getResponseBuffer(0)) : "null");
  
  response += "}";
  
  sendHttpResponse(client, "200 OK", "application/json", response);
}

void handleControl(TinyGsmClient& client, String body) {
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
      frequency = body.substring(freqIndex + 12).toFloat();
    }
  }

  uint8_t result = node.ku8MBSlaverequestError;

  if (command == "start") {
    result = node.writeSingleRegister(REG_CONTROL, CMD_RUN_FORWARD);
  } else if (command == "stop") {
    result = node.writeSingleRegister(REG_CONTROL, CMD_STOP);
  } else if (command == "set_frequency" && frequency > 0) {
    result = node.writeSingleRegister(REG_SET_FREQUENCY, (uint16_t)(frequency * 100));
  }

  if (result == node.ku8MBSuccess) {
    sendHttpResponse(client, "200 OK", "application/json", "{\"status\": \"success\"}");
  } else {
    sendHttpError(client, 500, "{\"status\": \"error\", \"code\": " + String(result) + "}");
  }
}

void sendHttpResponse(TinyGsmClient& client, String code, String contentType, String content) {
  client.println("HTTP/1.1 " + code);
  client.println("Content-Type: " + contentType);
  client.println("Connection: close");
  client.println("Content-Length: " + String(content.length()));
  client.println();
  client.println(content);
}

void sendHttpError(TinyGsmClient& client, int code, String message) {
  String codeStr = "500 Internal Server Error";
  if (code == 404) codeStr = "404 Not Found";
  if (code == 400) codeStr = "400 Bad Request";
  
  sendHttpResponse(client, codeStr, "application/json", "{\"error\": \"" + message + "\"}");
}