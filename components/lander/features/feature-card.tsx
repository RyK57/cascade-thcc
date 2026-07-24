import type { FeatureItem } from "./features-data";
import { FEATURE_ICONS } from "./features-data";

interface FeatureCardProps {
  feature: FeatureItem;
}

export function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = FEATURE_ICONS[feature.icon];

  return (
    <article className="rounded-xl border border-border/60 bg-card p-6">
      <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
        <Icon className="size-5" />
      </div>
      <h3 className="mb-2 text-lg font-medium">{feature.title}</h3>
      <p className="text-sm text-muted-foreground">{feature.description}</p>
    </article>
  );
}
