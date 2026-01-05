import { AppSidebar } from "@/components/app-sidebar";
import React, { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
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
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Page() {
  const [motorHertz, setMotorHertz] = useState(0);

  const handleSliderChange = (value: number[]) => {
    setMotorHertz(value[0]);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(event.target.value);
    if (isNaN(value)) {
      value = 0; // Default to 0 if input is not a valid number
    }
    // Clamp value between 0 and 60
    value = Math.max(0, Math.min(60, value));
    setMotorHertz(value);
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
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid h-full grid-cols-1 grid-rows-2 gap-4 lg:grid-cols-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Motor Control</CardTitle>
                <CardDescription>
                  Control the speed of the motor in Hertz.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button className="flex-1">Start</Button>
                  <Button variant="destructive" className="flex-1">
                    Stop
                  </Button>
                </div>
                <div className="mt-4">
                  <label
                    htmlFor="motor-hertz"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Motor Hertz (0-60Hz)
                  </label>
                  <div className="flex items-center gap-2 mt-1 py-2">
                    <Input
                      id="motor-hertz"
                      type="number"
                      min="0"
                      max="60"
                      value={motorHertz.toFixed(2)}
                      onChange={handleInputChange}
                      className="flex-1"
                    />
                    <span className="ml-auto">Hz</span>
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
            <Card className="h-full">
              <div className="p-4">Card Content 2</div>
            </Card>
            <Card className="h-full">
              <div className="p-4">Card Content 3</div>
            </Card>
            <Card className="h-full">
              <div className="p-4">Card Content 4</div>
            </Card>
          </div>
          {/* <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" /> */}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
