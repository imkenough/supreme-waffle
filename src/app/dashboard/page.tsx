import { AppSidebar } from "@/components/app-sidebar";
import React, { useState, useEffect } from "react";
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
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { Badge } from "@/components/ui/badge";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// --- MQTT Configuration ---
const MQTT_BROKER_URL = import.meta.env.VITE_MQTT_BROKER_URL;
const MQTT_USERNAME = import.meta.env.VITE_MQTT_USERNAME;
const MQTT_PASSWORD = import.meta.env.VITE_MQTT_PASSWORD;
const MQTT_TOPIC_CONTROL = "vfd/control";
const MQTT_TOPIC_STATUS = "vfd/status";

export default function Page() {
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);
  const [motorHertz, setMotorHertz] = useState(0);

  // States for all dynamic data
  const [motorStatus, setMotorStatus] = useState({
    currentState: "Stopped",
    frequency: 0,
    rpm: 0,
  });
  const [telemetry, setTelemetry] = useState({
    frequency: 0,
    current: 0,
    voltage: 0,
    fault: "None",
  });
  const [connectivity, setConnectivity] = useState({
    gsm: false,
    esp32: false,
    vfd: false,
  });
  const [lastCommandTimestamp, setLastCommandTimestamp] = useState(
    new Date().toISOString()
  );

  useEffect(() => {
    const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
    });
    mqttClient.on("connect", () => {
      setClient(mqttClient);
      console.log("Connected to MQTT broker");
      mqttClient.subscribe(MQTT_TOPIC_STATUS, (err) => {
        if (err) {
          console.error("Subscription error:", err);
        }
      });
    });

    mqttClient.on("message", (topic, message) => {
      if (topic === MQTT_TOPIC_STATUS) {
        try {
          const data = JSON.parse(message.toString());
          setMotorStatus({
            currentState: data.motorState,
            frequency: data.frequency,
            rpm: data.rpm,
          });
          setTelemetry({
            frequency: data.frequency,
            current: data.current,
            voltage: data.voltage,
            fault: data.fault || "None",
          });
          setConnectivity({
            gsm: true, // Assuming if we get a message, GSM is up
            esp32: true, // ESP32 is online
            vfd: data.vfd_responding,
          });
        } catch (e) {
          console.error("Failed to parse status message", e);
        }
      }
    });

    // Cleanup on unmount
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
        } else {
          setLastCommandTimestamp(new Date().toISOString());
        }
      });
    }
  };

  const handleStart = () => publishCommand({ command: "start" });
  const handleStop = () => publishCommand({ command: "stop" });
  const handleEmergencyStop = () =>
    publishCommand({ command: "emergency_stop" });

  const handleSliderChange = (value: number[]) => {
    const newHertz = value[0];
    setMotorHertz(newHertz);
    publishCommand({ command: "set_frequency", frequency: newHertz });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(event.target.value);
    if (isNaN(value)) {
      value = 0;
    }
    value = Math.max(0, Math.min(60, value));
    setMotorHertz(value);
    publishCommand({ command: "set_frequency", frequency: value });
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
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid h-full grid-cols-1 grid-rows-2 gap-4 lg:grid-cols-2">
            {/* Motor Control Card */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Motor Control</CardTitle>
                <CardDescription>
                  Control the speed of the motor in Hertz.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col h-full justify-between gap-4">
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleStart}>
                    Start
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleStop}
                  >
                    Stop
                  </Button>
                </div>
                <div>
                  <label
                    htmlFor="motor-hertz"
                    className="block text-sm font-medium text-muted-foreground"
                  >
                    Motor Hertz (0-60Hz)
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="motor-hertz"
                      type="number"
                      min="0"
                      max="60"
                      value={motorHertz.toFixed(2)}
                      onChange={handleInputChange}
                      className="flex-1"
                    />
                    <span className="ml-auto text-muted-foreground">Hz</span>
                  </div>
                  <div className="relative mt-2">
                    <Slider
                      id="motor-hertz-slider"
                      min={0}
                      max={60}
                      step={0.01}
                      value={[motorHertz]}
                      onValueChange={handleSliderChange}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-sm mt-1 px-1 text-muted-foreground">
                      <span>0Hz</span>
                      <span>30Hz</span>
                      <span>60Hz</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Motor Status Card */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Motor Status</CardTitle>
                <CardDescription>
                  Monitor the operational status of the motor.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col h-full justify-between gap-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Current State</span>
                    <Status
                      variant={
                        motorStatus.currentState === "Running"
                          ? "info"
                          : "default"
                      }
                    >
                      <StatusIndicator />
                      <StatusLabel>{motorStatus.currentState}</StatusLabel>
                    </Status>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Frequency</span>
                    <span className="text-lg font-bold">
                      {motorStatus.frequency.toFixed(2)} Hz
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">RPM</span>
                    <span className="text-lg font-bold">
                      {motorStatus.rpm} RPM
                    </span>
                  </div>
                </div>
                <div>
                  <Button
                    variant="destructive"
                    className="w-full text-lg h-12"
                    onClick={handleEmergencyStop}
                  >
                    EMERGENCY STOP
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Telemetry Panel Card */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Telemetry Panel</CardTitle>
                <CardDescription>
                  Monitor real-time system parameters.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col h-full justify-between gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Frequency
                    </div>
                    <div className="text-lg font-bold">
                      {telemetry.frequency.toFixed(2)} Hz
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Current
                    </div>
                    <div className="text-lg font-bold">
                      {telemetry.current.toFixed(2)} A
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Voltage
                    </div>
                    <div className="text-lg font-bold">
                      {telemetry.voltage.toFixed(1)} V
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Fault
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        telemetry.fault === "None"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {telemetry.fault}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connectivity Status Card */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Connectivity Status</CardTitle>
                <CardDescription>
                  Monitor the status of connected devices.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span>GSM</span>
                  <Badge variant={connectivity.gsm ? "success" : "destructive"}>
                    {connectivity.gsm ? "Connected" : "No Signal"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>ESP32</span>
                  <Badge
                    variant={connectivity.esp32 ? "success" : "destructive"}
                  >
                    {connectivity.esp32 ? "Online" : "Offline"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>VFD</span>
                  <Badge variant={connectivity.vfd ? "success" : "destructive"}>
                    {connectivity.vfd ? "Responding" : "No Response"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Command</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(lastCommandTimestamp).toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
