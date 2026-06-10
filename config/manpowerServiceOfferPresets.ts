/**
 * Manpower subcategory → selectable task presets (IDs aligned with imagi-mitra).
 * Stored on the service as metadata.manpowerTaskIds + metadata.manpowerCustomTasks.
 */

export type ManpowerServiceOfferPreset = { id: string; label: string };

const MANPOWER_TASK_IDS: Record<string, string[]> = {
  electrician: [
    "tubelight_installation",
    "tubelight_chock_replacement",
    "switch_socket_change_per_unit",
    "switch_plate_change_top_panel",
    "switch_board_change",
    "switch_socket_electric_point_repair",
    "switch_socket_bulb_holder_replacement",
    "fuse_replacement_mcb_trip",
    "mcb_change",
    "ceiling_fan_new_installation",
    "ceiling_fan_replacement",
    "fan_capacitor_change",
    "fan_regulator_change",
  ],
  plumber: [
    "tap_installation_standard",
    "tap_installation_premium",
    "tap_repair_standard",
    "tap_repair_premium",
    "washer_change",
    "shower_repairing",
    "shower_kit_repairing_or_replacement",
    "kitchen_sink_replacement",
    "kitchen_platform_or_sink_leakage_blockage",
    "wash_basin_pipe_replacement_base_or_connection",
    "wash_basin_tap_change_or_repair_base_or_connection",
    "wash_basin_replacement_complete",
    "jet_spray_installation",
    "commode_western_style_replacement",
    "commode_repairing_seat",
    "toilet_flush_repairing_open",
    "toilet_flush_repairing_concealed",
    "towel_rod_or_hanger_installation",
    "soap_holder_installation",
    "mirrors_depending_on_size",
    "hand_dryers",
    "bathtub_installation",
    "blockage_kitchen_or_bathroom_internal",
    "washing_machine_connection_standard_fittings",
    "wall_mixer_repair",
  ],
  mason: ["brick_work", "plaster", "flooring", "repair_patch"],
  carpenter: [
    "night_latch_inter_lock",
    "tower_bolt",
    "door_installation_upto_6ft",
    "door_installation_6_to_8ft",
    "door_handles_knobs",
    "door_pullers_installation_wood_only",
    "door_closures",
    "door_repair",
    "door_movement_repair",
    "door_stopper_basic",
    "door_stopper_both_sides_basic",
    "door_mesh_replacement",
    "door_frame_fitting",
    "window_repair",
    "window_mesh_replacement",
    "drawer_channel_or_slider_repair",
    "drawer_normal_channel",
    "dressing_table_minor_repair",
    "table_glass_replacement",
    "chair_repair",
    "dining_table_repair",
    "almirah_repair",
    "kitchen_cabinet_door_repairing_or_resetting",
    "drilling_normal_walls_non_rcc",
    "drilling_normal_tiles",
    "bed_open_dismantling",
  ],
  painter: ["interior_paint", "exterior_paint", "texture", "waterproofing"],
  helper: ["loading", "cleaning", "site_help"],
};

export function humanizeManpowerTaskId(id: string): string {
  return String(id || "")
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Map UI subcategory / worker type string to preset bucket (electrician, plumber, …). */
export function normalizeManpowerWorkerTypeKey(workerType: string): string {
  const raw = String(workerType || "").trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (MANPOWER_TASK_IDS[lower]) return lower;
  const compact = lower.replace(/\s+/g, "_");
  if (MANPOWER_TASK_IDS[compact]) return compact;
  if (lower.includes("electric")) return "electrician";
  if (lower.includes("plumb")) return "plumber";
  if (lower.includes("mason") || lower.includes("raj")) return "mason";
  if (lower.includes("carpent")) return "carpenter";
  if (lower.includes("paint")) return "painter";
  if (lower.includes("help")) return "helper";
  return compact;
}

export function getManpowerServiceOfferPresetsForSubcategory(subcategory: string): ManpowerServiceOfferPreset[] {
  const key = normalizeManpowerWorkerTypeKey(subcategory);
  if (!key) return [];
  const ids = MANPOWER_TASK_IDS[key] ?? [];
  return ids.map((id) => ({ id, label: humanizeManpowerTaskId(id) }));
}
