
export default function getRelativeTime(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat("ru", { numeric: "auto" });
  
    if (seconds < 60) {
      return rtf.format(-seconds, "second");
    } else if (seconds < 3600) {
      return rtf.format(-Math.floor(seconds / 60), "minute");
    } else if (seconds < 86400) {
      return rtf.format(-Math.floor(seconds / 3600), "hour");
    } else if (seconds < 2592000) {
      return rtf.format(-Math.floor(seconds / 86400), "day");
    } else if (seconds < 31536000) {
      return rtf.format(-Math.floor(seconds / 2592000), "month");
    } else {
      return rtf.format(-Math.floor(seconds / 31536000), "year");
    }
}
  