import { useState } from "react";
import "./ImageFrame.css";

// Every picture in Chronos is optional, so this draws nothing at all when there
// is no url — the surrounding text layout is the fallback, exactly as it looked
// before pictures existed.
//
// It also hides itself if the image fails to load. A scenario can hold a url
// that has been deleted from Cloudinary, and a broken-image icon looks worse
// than no image.
export function ImageFrame({ src, alt, ratio = "16 / 9", className = "" }) {
  // Which url failed, rather than a yes/no flag. A new url is automatically not
  // equal to the failed one, so it retries on its own — no effect needed to
  // reset anything. That matters when an admin uploads a working replacement.
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || failedSrc === src) {
    return null;
  }

  return (
    <figure
      className={`image-frame ${className}`.trim()}
      style={{ aspectRatio: ratio }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailedSrc(src)}
      />
    </figure>
  );
}
