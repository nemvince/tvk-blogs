import { render } from "hono/jsx/dom";
import { ZoomableImage } from "./components/ZoomableImage";

// Auto-enhance article images with zoom functionality
function enhanceArticleImages() {
	const images = document.querySelectorAll("article img");

	images.forEach((img) => {
		const htmlImg = img as HTMLImageElement;
		const { src, alt } = htmlImg;

		const container = document.createElement("span");
		container.style.display = "contents"; // Don't affect layout

		htmlImg.replaceWith(container);
		render(<ZoomableImage src={src} alt={alt || ""} />, container);
	});
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", enhanceArticleImages);
} else {
	enhanceArticleImages();
}
