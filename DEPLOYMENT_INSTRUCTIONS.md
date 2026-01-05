## Finalization & Deployment Instructions

You're all set! Here’s how to get your project deployed and running.

### 1. Set up Your MQTT Broker (HiveMQ)

This is the central server that your website and ESP32 will talk to. We'll use HiveMQ Cloud's free plan.

1.  **Go to the [HiveMQ Cloud Sign-up Page](https://www.hivemq.com/mqtt-cloud-broker/plans/)**.
2.  Choose the **"Free"** plan.
3.  Complete the sign-up process.
4.  Once you have your cluster, go to its "Access Management" or "Credentials" section. Create a username and password (you've already done this: `espmodmqtt` / `Espmod800485`).
5.  Find your **Broker URL**, **Port**, and **TLS WebSocket URL**.

### 2. Deploy Your React Website to Vercel

This will make your website live on the internet.

1.  **Create a GitHub Repository:** If you haven't already, create a new repository on [GitHub](https://github.com) and push your project code to it.
2.  **Sign up for Vercel:** Go to [vercel.com](https://vercel.com) and sign up with your GitHub account.
3.  **Create a New Project:**
    *   In your Vercel dashboard, click "Add New..." -> "Project".
    *   Select the GitHub repository you just created.
    *   Vercel will automatically detect that you're using **Vite** and configure the build settings correctly.
4.  **Configure Environment Variables in Vercel:**
    *   In your Vercel project settings, navigate to "Environment Variables".
    *   Add the following variables, using the values from your local `.env` file and HiveMQ Cloud:
        *   `VITE_MQTT_BROKER_URL`: Your full TLS WebSocket URL from HiveMQ Cloud (e.g., `wss://your-cluster-url.s1.eu.hivemq.cloud:8884/mqtt`).
        *   `VITE_MQTT_USERNAME`: Your HiveMQ username (e.g., `espmodmqtt`).
        *   `VITE_MQTT_PASSWORD`: Your HiveMQ password (e.g., `Espmod800485`).
    *   Vercel will automatically inject these variables into your React application during the build process.
5.  **Deploy:** Click the "Deploy" button. Vercel will build your site and give you a public URL (e.g., `your-project.vercel.app`).

### 3. Flash Your ESP32

1.  **Open Arduino IDE:** Open the `esp32_vfd_controller.ino` file.
2.  **Install Libraries:** Go to "Sketch" -> "Include Library" -> "Manage Libraries..." and install the following:
    *   `TinyGsmClient` by Volodymyr Shymanskyy
    *   `PubSubClient` by Nick O'Leary
    *   `ModbusMaster` by Doc Walker
    *   `ArduinoJson` by Benoit Blanchon
3.  **Update Credentials & URLs in `config.h`:**
    *   Open the `config.h` file (refer to the `README.md` for its location and setup).
    *   Replace `"YOUR_APN"` with your mobile carrier's APN in the `#define GPRS_APN` line.
    *   Replace `"your-cluster-url.s1.eu.hivemq.cloud"` with your actual **Broker URL** from HiveMQ Cloud in the `#define MQTT_BROKER` line (without `http://` or `mqtt://`, and without the port).
    *   Verify the `#define MQTT_PORT` is correct (usually `1883` for non-TLS TCP connection).
    *   The `#define MQTT_USERNAME` and `#define MQTT_PASSWORD` are already set to `espmodmqtt` and `Espmod800485` respectively.
4.  **Upload:** Connect your ESP32, select the correct board and port in the Arduino IDE, and click "Upload".
5.  **Monitor:** Open the Serial Monitor at `115200` baud to see the connection status and debug messages.

Once these steps are complete, your ESP32 will connect to the internet and the MQTT broker. You can then open your Vercel URL, and the website will connect to the same broker, allowing you to control and monitor your VFD in real-time from anywhere.