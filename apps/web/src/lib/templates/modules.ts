interface ModuleTemplate {
  name: string;
  type: string;
  description: string;
  ports: Array<{
    portId: string;
    name: string;
    direction: "in" | "out" | "bidirectional";
    protocol?: string;
    voltage?: number;
  }>;
  dimension: { w: number; h: number; d: number };
}

export const moduleTemplates: ModuleTemplate[] = [
  {
    name: "Power",
    type: "power",
    description: "Voltage regulation and power distribution module",
    ports: [
      { portId: "p1", name: "VIN", direction: "in", protocol: "power", voltage: 5 },
      { portId: "p2", name: "5V", direction: "out", protocol: "power", voltage: 5 },
      { portId: "p3", name: "3.3V", direction: "out", protocol: "power", voltage: 3.3 },
      { portId: "p4", name: "GND", direction: "bidirectional", protocol: "power" },
    ],
    dimension: { w: 30, h: 25, d: 5 },
  },
  {
    name: "MCU",
    type: "mcu",
    description: "Microcontroller module (ESP32 / STM32 / RP2040)",
    ports: [
      { portId: "p1", name: "3.3V", direction: "in", protocol: "power", voltage: 3.3 },
      { portId: "p2", name: "GND", direction: "bidirectional", protocol: "power" },
      { portId: "p3", name: "I2C_SCL", direction: "bidirectional", protocol: "I2C" },
      { portId: "p4", name: "I2C_SDA", direction: "bidirectional", protocol: "I2C" },
      { portId: "p5", name: "SPI_SCK", direction: "out", protocol: "SPI" },
      { portId: "p6", name: "SPI_MOSI", direction: "out", protocol: "SPI" },
      { portId: "p7", name: "SPI_MISO", direction: "in", protocol: "SPI" },
      { portId: "p8", name: "GPIO0", direction: "bidirectional", protocol: "GPIO" },
      { portId: "p9", name: "GPIO1", direction: "bidirectional", protocol: "GPIO" },
      { portId: "p10", name: "UART_TX", direction: "out", protocol: "UART" },
      { portId: "p11", name: "UART_RX", direction: "in", protocol: "UART" },
    ],
    dimension: { w: 35, h: 30, d: 5 },
  },
  {
    name: "Sensor",
    type: "sensor",
    description: "Generic sensor module (temperature, humidity, IMU, light)",
    ports: [
      { portId: "p1", name: "3.3V", direction: "in", protocol: "power", voltage: 3.3 },
      { portId: "p2", name: "GND", direction: "bidirectional", protocol: "power" },
      { portId: "p3", name: "I2C_SCL", direction: "in", protocol: "I2C" },
      { portId: "p4", name: "I2C_SDA", direction: "bidirectional", protocol: "I2C" },
    ],
    dimension: { w: 20, h: 20, d: 3 },
  },
  {
    name: "Display",
    type: "display",
    description: "OLED / TFT / E-Ink display module",
    ports: [
      { portId: "p1", name: "3.3V", direction: "in", protocol: "power", voltage: 3.3 },
      { portId: "p2", name: "GND", direction: "bidirectional", protocol: "power" },
      { portId: "p3", name: "I2C_SCL", direction: "in", protocol: "I2C" },
      { portId: "p4", name: "I2C_SDA", direction: "bidirectional", protocol: "I2C" },
      { portId: "p5", name: "RESET", direction: "in", protocol: "GPIO" },
    ],
    dimension: { w: 40, h: 30, d: 3 },
  },
  {
    name: "Battery",
    type: "battery",
    description: "Battery power with charging circuit (LiPo / Li-Ion)",
    ports: [
      { portId: "p1", name: "VBAT", direction: "out", protocol: "power", voltage: 3.7 },
      { portId: "p2", name: "VUSB", direction: "in", protocol: "power", voltage: 5 },
      { portId: "p3", name: "GND", direction: "bidirectional", protocol: "power" },
      { portId: "p4", name: "BAT_SENSE", direction: "out", protocol: "analog" },
    ],
    dimension: { w: 35, h: 25, d: 8 },
  },
  {
    name: "Connectivity",
    type: "connectivity",
    description: "WiFi / Bluetooth / LoRa / NFC connectivity module",
    ports: [
      { portId: "p1", name: "3.3V", direction: "in", protocol: "power", voltage: 3.3 },
      { portId: "p2", name: "GND", direction: "bidirectional", protocol: "power" },
      { portId: "p3", name: "UART_TX", direction: "in", protocol: "UART" },
      { portId: "p4", name: "UART_RX", direction: "out", protocol: "UART" },
      { portId: "p5", name: "RESET", direction: "in", protocol: "GPIO" },
      { portId: "p6", name: "ANT", direction: "bidirectional", protocol: "RF" },
    ],
    dimension: { w: 25, h: 20, d: 3 },
  },
  {
    name: "Storage",
    type: "storage",
    description: "SD card / flash / EEPROM storage module",
    ports: [
      { portId: "p1", name: "3.3V", direction: "in", protocol: "power", voltage: 3.3 },
      { portId: "p2", name: "GND", direction: "bidirectional", protocol: "power" },
      { portId: "p3", name: "SPI_SCK", direction: "in", protocol: "SPI" },
      { portId: "p4", name: "SPI_MOSI", direction: "in", protocol: "SPI" },
      { portId: "p5", name: "SPI_MISO", direction: "out", protocol: "SPI" },
      { portId: "p6", name: "CS", direction: "in", protocol: "GPIO" },
    ],
    dimension: { w: 25, h: 20, d: 3 },
  },
  {
    name: "Actuator",
    type: "actuator",
    description: "Motor driver / servo / solenoid actuator module",
    ports: [
      { portId: "p1", name: "VCC", direction: "in", protocol: "power", voltage: 5 },
      { portId: "p2", name: "GND", direction: "bidirectional", protocol: "power" },
      { portId: "p3", name: "PWM1", direction: "in", protocol: "GPIO" },
      { portId: "p4", name: "PWM2", direction: "in", protocol: "GPIO" },
      { portId: "p5", name: "ENABLE", direction: "in", protocol: "GPIO" },
    ],
    dimension: { w: 30, h: 25, d: 5 },
  },
];
