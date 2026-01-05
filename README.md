# VFD Control Dashboard

This project is a web-based dashboard to control and monitor a Mitsubishi FR-E700 VFD (Variable Frequency Drive) remotely. It consists of a React frontend and an ESP32 firmware that communicates with the VFD via Modbus RTU.

## Architecture

-   **Frontend:** A React application built with Vite, using TailwindCSS and shadcn/ui for styling.
-   **Backend/Device:** An ESP32 microcontroller running custom firmware.
-   **Communication:**
    -   The ESP32 connects to the internet via a SIM800C GPRS module.
    -   The ESP32 communicates with the VFD using Modbus RTU over an RS-485 interface (MAX485 module).
    -   The frontend and the ESP32 communicate in real-time using an **MQTT Broker** (e.g., HiveMQ Cloud).

## Setup & Configuration

### 1. Frontend (React App)

The frontend is configured using environment variables.

1.  **Create a `.env` file** in the root of the project.
2.  Copy the contents from `.env.example` into your new `.env` file.
3.  **Fill in the values:**
    -   `VITE_MQTT_BROKER_URL`: Your full TLS WebSocket URL from HiveMQ Cloud (e.g., `wss://your-cluster-url.s1.eu.hivemq.cloud:8884/mqtt`).
    -   `VITE_MQTT_USERNAME`: Your HiveMQ username.
    -   `VITE_MQTT_PASSWORD`: Your HiveMQ password.

### 2. Device (ESP32 Firmware)

The ESP32 firmware is configured using a `config.h` header file.

1.  **Create a `config.h` file** in the same directory as `esp32_vfd_controller.ino`.
2.  Copy the contents from `config.h.example` into your new `config.h` file.
3.  **Fill in the values:**
    -   `GPRS_APN`: Your mobile carrier's Access Point Name for GPRS.
    -   `MQTT_BROKER`: Your HiveMQ Cluster URL (e.g., `your-cluster-url.s1.eu.hivemq.cloud`). **Do not include the port or `wss://`**.
    -   `MQTT_PORT`: The standard TCP port for your MQTT broker (usually `1883` for non-TLS or `8883` for TLS).
    -   `MQTT_USERNAME`: Your HiveMQ username.
    -   `MQTT_PASSWORD`: Your HiveMQ password.

### 3. VFD Parameters

Ensure your Mitsubishi FR-E700 VFD is configured for Modbus RTU communication as per the settings in `esp32_vfd_controller.ino` and the `espcondigdocs.pdf`.

## Deployment

Follow the instructions in `DEPLOYMENT_INSTRUCTIONS.md` to deploy the frontend to Vercel and flash the firmware to your ESP32.