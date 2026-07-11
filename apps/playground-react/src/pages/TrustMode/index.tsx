import { FeaturePage } from "../FeaturePage";
import { featureConfigs } from "../pageConfigs";

export function TrustMode() {
  return <FeaturePage config={featureConfigs.trustMode} />;
}
