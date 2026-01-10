import { AppSidebar } from "@/components/app-sidebar";
import { useState, useEffect } from "react";
import mqtt from "mqtt";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
// import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
// import { Badge } from "@/components/ui/badge";

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-red-500">Configuration Error</CardTitle>
          <CardDescription>
            The relay controls cannot start due to missing environment
            variables.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{message}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            Please ensure all required `VITE_MQTT_*` environment variables are
            set in your `.env` file.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Page() {
  // --- MQTT Configuration ---
  const MQTT_BROKER_URL = import.meta.env.VITE_MQTT_BROKER_URL;
  const MQTT_USERNAME = import.meta.env.VITE_MQTT_USERNAME;
  const MQTT_PASSWORD = import.meta.env.VITE_MQTT_PASSWORD;
  const MQTT_TOPIC_RELAYS = "vfd/relays";
  const MQTT_TOPIC_STATUS = "vfd/status"; // To get connectivity status

  // Validate environment variables
  if (!MQTT_BROKER_URL) {
    return (
      <ErrorDisplay message="Missing VITE_MQTT_BROKER_URL environment variable." />
    );
  }
  if (!MQTT_USERNAME) {
    return (
      <ErrorDisplay message="Missing VITE_MQTT_USERNAME environment variable." />
    );
  }
  if (!MQTT_PASSWORD) {
    return (
      <ErrorDisplay message="Missing VITE_MQTT_PASSWORD environment variable." />
    );
  }

  const [client, setClient] = useState<mqtt.MqttClient | null>(null);
  const [relayStates, setRelayStates] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);
  const [mqttConnected, setMqttConnected] = useState(false);
  const [esp32Online, setEsp32Online] = useState(false);

  useEffect(() => {
    const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
    });

    mqttClient.on("connect", () => {
      setClient(mqttClient);
      setMqttConnected(true);
      console.log("Connected to MQTT broker");
      mqttClient.subscribe(MQTT_TOPIC_STATUS, (err) => {
        if (err) {
          console.error("Subscription error:", err);
        }
      });
    });

    mqttClient.on("reconnect", () => {
      setMqttConnected(false);
      setEsp32Online(false);
      console.log("Reconnecting to MQTT broker...");
    });

    mqttClient.on("offline", () => {
      setMqttConnected(false);
      setEsp32Online(false);
      console.log("MQTT client offline");
    });

    mqttClient.on("error", (err) => {
      setMqttConnected(false);
      setEsp32Online(false);
      console.error("MQTT client error:", err);
    });

    mqttClient.on("message", (topic, message) => {
      if (topic === MQTT_TOPIC_STATUS) {
        try {
          const data = JSON.parse(message.toString());
          setEsp32Online(data.esp32_online || false); // Assuming status message includes esp32_online
          // If the ESP32 sends current relay states, you could update relayStates here
        } catch (e) {
          console.error("Failed to parse status message", e);
        }
      }
    });

    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, []);

  const publishRelayCommand = (relayNum: number, state: boolean) => {
    if (client && mqttConnected && esp32Online) {
      const command = {
        relay_command: "set_state",
        relay_num: relayNum,
        state: state,
      };
      client.publish(MQTT_TOPIC_RELAYS, JSON.stringify(command), (err) => {
        if (err) {
          console.error("Publish error:", err);
        } else {
          console.log(
            `Published relay ${relayNum} command: ${state ? "ON" : "OFF"}`
          );
        }
      });
    } else {
      console.warn(
        "MQTT client not connected or ESP32 offline. Cannot send command."
      );
    }
  };

  const toggleRelay = (index: number) => {
    setRelayStates((prevStates) => {
      const newStates = [...prevStates];
      const newState = !newStates[index];
      newStates[index] = newState;
      publishRelayCommand(index + 1, newState); // Relay numbers are 1-indexed
      return newStates;
    });
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Relay Controls</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {(!mqttConnected || !esp32Online) && (
            <Card className="w-full bg-yellow-100 border-yellow-400 text-yellow-800">
              <CardHeader>
                <CardTitle className="text-yellow-800">
                  Connection Warning
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!mqttConnected && <p>Not connected to MQTT broker.</p>}
                {!esp32Online && (
                  <p>ESP32 is offline or not sending status updates.</p>
                )}
                <p className="mt-2 text-sm">
                  Relay commands will not be sent until connection is
                  established.
                </p>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {relayStates.map((state, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>Relay {index + 1}</CardTitle>
                  <CardDescription>Control channel {index + 1}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => toggleRelay(index)}
                    className="w-full"
                    variant={state ? "destructive" : "default"}
                    disabled={!mqttConnected || !esp32Online}
                  >
                    {state ? "Turn Off" : "Turn On"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
