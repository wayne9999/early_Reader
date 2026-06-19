export const supportConfig = {
  email: import.meta.env.VITE_SUPPORT_EMAIL || "support@readnest.app"
};

export function supportMailtoHref(subject = "ReadNest support request") {
  return `mailto:${supportConfig.email}?subject=${encodeURIComponent(subject)}`;
}
