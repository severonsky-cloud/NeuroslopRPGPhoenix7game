import { installAshgraveWindowExtensions } from './engineAshgraveWindowExtensions.js?v=v3p2_act1_vehicle_fix_1';
import { installAct1CompletionExtensions } from './engineAct1CompletionExtensions.js?v=v3p2_act1_vehicle_fix_1';
import { installEntityDebugExtensions } from './engineEntityDebugExtensions.js?v=v3p2_act1_vehicle_fix_1';
import { installAct1VehicleBridgeExtensions } from './engineAct1VehicleBridgeExtensions.js?v=v3p2_act1_vehicle_fix_1';
import { installAct1RoadEventsExtensions } from './engineAct1RoadEventsExtensions.js?v=v3p2_act1_vehicle_fix_1';
import { installAct1RuntimeRepairExtensions } from './engineAct1RuntimeRepairExtensions.js?v=v3p2_act1_vehicle_fix_1';
import { installAct1VehicleTargetRepairExtensions } from './engineAct1VehicleTargetRepairExtensions.js?v=v3p2_act1_vehicle_fix_1';

export function installAct1IntegratedExtensions(PhoenixV3Engine) {
  installAshgraveWindowExtensions(PhoenixV3Engine);
  installAct1CompletionExtensions(PhoenixV3Engine);
  installEntityDebugExtensions(PhoenixV3Engine);
  installAct1VehicleBridgeExtensions(PhoenixV3Engine);
  installAct1RoadEventsExtensions(PhoenixV3Engine);
  installAct1RuntimeRepairExtensions(PhoenixV3Engine);
  installAct1VehicleTargetRepairExtensions(PhoenixV3Engine);
}
