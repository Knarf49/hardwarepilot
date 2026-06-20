import { z } from "zod";

export const EnclosureGenSchema = z.object({
  formId: z.string().uuid(),
  strategy: z.enum(["single_board", "multi_board", "flex_pcb"]),
  mountingPoints: z
    .array(
      z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
        type: z.enum(["screw", "snap_fit", "adhesive", "custom"]),
      }),
    )
    .optional(),
  cutouts: z
    .array(
      z.object({
        name: z.string(),
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number(),
        type: z.enum(["usb", "display", "button", "led", "ventilation", "custom"]),
      }),
    )
    .optional(),
  stlPreviewPath: z.string().optional(),
});

export type EnclosureGen = z.infer<typeof EnclosureGenSchema>;
