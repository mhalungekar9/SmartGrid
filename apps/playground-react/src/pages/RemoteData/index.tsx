import { FeaturePage } from "../FeaturePage";
import { featureConfigs } from "../pageConfigs";

export function RemoteData() {
  return <FeaturePage config={featureConfigs.remoteData} />;
}
