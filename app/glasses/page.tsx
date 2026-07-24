import { GlassesHud } from "./glasses-hud";

export const metadata = {
  title: "Cascade HUD",
};

/**
 * Ray-Ban Display web app. Loaded on-glasses via QR scan in the Meta AI app
 * (public HTTPS URL). 600x600 monocular HUD: pure black background renders
 * transparent; Neural Band d-pad arrives as arrow keys, pinch as Enter.
 * Preview on desktop with arrow keys.
 */
export default function GlassesPage() {
  return <GlassesHud />;
}
