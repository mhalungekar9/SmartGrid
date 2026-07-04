import { FeaturePage } from "../FeaturePage";
import { featureConfigs } from "../pageConfigs";

export function Theme() {
  return <FeaturePage config={featureConfigs.theme} />;
}
