import { FeaturePage } from "../FeaturePage";
import { featureConfigs } from "../pageConfigs";

export function Export() {
  return <FeaturePage config={featureConfigs.export} />;
}
