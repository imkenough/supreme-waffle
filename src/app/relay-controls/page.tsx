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
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

// --- MQTT Configuration ---
const MQTT_BROKER_URL = import.meta.env.VITE_MQTT_BROKER_URL;
const MQTT_USERNAME = import.meta.env.VITE_MQTT_USERNAME;
const MQTT_PASSWORD = import.meta.env.VITE_MQTT_PASSWORD;
const MQTT_TOPIC_CONTROL = "vfd/control";
const MQTT_TOPIC_STATUS = "vfd/relays/status";
const MQTT_TOPIC_GET_STATUS = "vfd/relays/get_status";

export default function RelayControlsPage() {
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);
  const [relayStates, setRelayStates] = useState([false, false, false, false]);
  const [loadingStates, setLoadingStates] = useState([
    true,
    true,
    true,
    true,
  ]);

  useEffect(() => {
    const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
    });
    mqttClient.on("connect", () => {
      setClient(mqttClient);
      console.log("Connected to MQTT broker for relay controls.");
      mqttClient.subscribe(MQTT_TOPIC_STATUS, (err) => {
        if (err) {
          console.error("Subscribe to status error:", err);
        } else {
          // Request initial status on successful subscription
          mqttClient.publish(MQTT_TOPIC_GET_STATUS, "");
        }
      });
    });

    mqttClient.on("message", (topic, payload) => {
      if (topic === MQTT_TOPIC_STATUS) {
        try {
          const status = JSON.parse(payload.toString());
          if (status.relayStates && Array.isArray(status.relayStates)) {
            setRelayStates(status.relayStates);
            // Once we get a status update, we can assume all relays have reported
            setLoadingStates([false, false, false, false]);
          }
        } catch (e) {
          console.error("Failed to parse status message", e);
        }
      }
    });

    mqttClient.on("error", (err) => {
      console.error("MQTT client error:", err);
    });

    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, []);

  const publishCommand = (command: object) => {
    if (client) {
      client.publish(MQTT_TOPIC_CONTROL, JSON.stringify(command), (err) => {
        if (err) {
          console.error("Publish error:", err);
        }
      });
    }
  };

  const handleRelayToggle = (relayIndex: number, checked: boolean) => {
    // Optimistically update the UI for responsiveness
    const newRelayStates = [...relayStates];
    newRelayStates[relayIndex] = checked;
    setRelayStates(newRelayStates);

    // Set loading state for the specific relay
    const newLoadingStates = [...loadingStates];
    newLoadingStates[relayIndex] = true;
    setLoadingStates(newLoadingStates);

    publishCommand({
      command: "set_relay",
      relay: relayIndex + 1,
      state: checked ? "on" : "off",
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
        <div className="flex-1 p-4 lg:p-6">
          <h1 className="text-2xl font-semibold">Relay Controls</h1>
          <p className="text-muted-foreground">
            Control the 4-channel relay module connected to the ESP32.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Switch
                  id={`relay-${i + 1}`}
                  checked={relayStates[i]}
                  onCheckedChange={(checked) => handleRelayToggle(i, checked)}
                />
                <Label htmlFor={`relay-${i + 1}`}>Relay {i + 1}</Label>
                {loadingStates[i] && (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1.5"
                  >
                    <Spinner />
                    Updating
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
