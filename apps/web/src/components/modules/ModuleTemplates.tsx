"use client";

import { Battery, Cpu, Gauge, HardDrive, Radio, Rows3, Tablet, Zap } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createModuleFromTemplate } from "@/actions/module";

interface ModuleTemplate {
  name: string;
  type: string;
  description: string;
  icon: typeof Cpu;
}

const templates: (ModuleTemplate & { index: number })[] = [
  {
    name: "Power",
    type: "power",
    description: "Voltage regulation & distribution",
    icon: Zap,
    index: 0,
  },
  { name: "MCU", type: "mcu", description: "ESP32 / STM32 / RP2040", icon: Cpu, index: 1 },
  {
    name: "Sensor",
    type: "sensor",
    description: "Temperature, IMU, light sensor",
    icon: Gauge,
    index: 2,
  },
  {
    name: "Display",
    type: "display",
    description: "OLED / TFT / E-Ink display",
    icon: Tablet,
    index: 3,
  },
  {
    name: "Battery",
    type: "battery",
    description: "LiPo / Li-Ion with charging",
    icon: Battery,
    index: 4,
  },
  {
    name: "Connectivity",
    type: "connectivity",
    description: "WiFi / BLE / LoRa / NFC",
    icon: Radio,
    index: 5,
  },
  {
    name: "Storage",
    type: "storage",
    description: "SD card / Flash / EEPROM",
    icon: HardDrive,
    index: 6,
  },
  {
    name: "Actuator",
    type: "actuator",
    description: "Motor driver / servo / solenoid",
    icon: Rows3,
    index: 7,
  },
];

function SubmitButton({ template }: { template: ModuleTemplate }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-3 p-3 rounded-lg border border-neutral-800 bg-neutral-900 hover:border-[#7C5CFC]/40 hover:bg-neutral-800/50 transition-all text-left w-full group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="w-9 h-9 rounded-lg bg-[#7C5CFC]/10 flex items-center justify-center shrink-0">
        <template.icon className="w-4 h-4 text-[#7C5CFC]" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-neutral-200 group-hover:text-neutral-100">
          {template.name}
        </div>
        <div className="text-xs text-neutral-500 truncate">{template.description}</div>
      </div>
      {pending ? (
        <span className="ml-auto text-xs text-[#7C5CFC] animate-pulse">Adding...</span>
      ) : (
        <Zap className="w-3 h-3 text-neutral-700 group-hover:text-[#7C5CFC] ml-auto shrink-0 transition-colors" />
      )}
    </button>
  );
}

function TemplateButton({
  template,
  projectId,
}: {
  template: ModuleTemplate & { index: number };
  projectId: string;
}) {
  const [, formAction] = useActionState(createModuleFromTemplate, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="templateIndex" value={template.index} />
      <SubmitButton template={template} />
    </form>
  );
}

export function ModuleTemplates({ projectId }: { projectId: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3">
        Quick Add Templates
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {templates.map((t) => (
          <TemplateButton key={t.type} template={t} projectId={projectId} />
        ))}
      </div>
    </div>
  );
}
