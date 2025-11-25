import type { FC } from "hono/jsx";
import { useEffect, useRef, useState } from "hono/jsx";

interface ZoomableImageProps {
	src: string;
	alt?: string;
	className?: string;
}

interface ViewerState {
	isOpen: boolean;
	scale: number;
	translateX: number;
	translateY: number;
	isDragging: boolean;
}

export const ZoomableImage: FC<ZoomableImageProps> = ({
	src,
	alt = "",
	className = "",
}) => {
	const [state, setState] = useState<ViewerState>({
		isOpen: false,
		scale: 1,
		translateX: 0,
		translateY: 0,
		isDragging: false,
	});

	const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
	const lastTouchDistanceRef = useRef<number>(0);
	const imgRef = useRef<HTMLImageElement>(null);
	const viewerRef = useRef<HTMLDivElement>(null);

	const updateTransform = (
		scale: number,
		translateX: number,
		translateY: number,
	) => {
		setState((prev) => ({ ...prev, scale, translateX, translateY }));
	};

	const openViewer = () => {
		setState({
			isOpen: true,
			scale: 1,
			translateX: 0,
			translateY: 0,
			isDragging: false,
		});
		document.body.style.overflow = "hidden";
	};

	const closeViewer = () => {
		setState((prev) => ({ ...prev, isOpen: false }));
		document.body.style.overflow = "";
	};

	const handleWheel = (e: WheelEvent) => {
		e.preventDefault();
		const delta = e.deltaY > 0 ? 0.9 : 1.1;
		let newScale = state.scale * delta;
		newScale = Math.max(0.5, Math.min(newScale, 5));
		updateTransform(newScale, state.translateX, state.translateY);
	};

	const startDrag = (e: MouseEvent) => {
		if (e.target === imgRef.current) {
			e.preventDefault();
			setState((prev) => ({ ...prev, isDragging: true }));
			startPosRef.current = {
				x: e.clientX - state.translateX,
				y: e.clientY - state.translateY,
			};
		}
	};

	const drag = (e: MouseEvent) => {
		if (!state.isDragging || !startPosRef.current) return;
		e.preventDefault();
		const newX = e.clientX - startPosRef.current.x;
		const newY = e.clientY - startPosRef.current.y;
		updateTransform(state.scale, newX, newY);
	};

	const stopDrag = () => {
		setState((prev) => ({ ...prev, isDragging: false }));
	};

	const handleTouchStart = (e: TouchEvent) => {
		if (e.touches.length === 1) {
			setState((prev) => ({ ...prev, isDragging: true }));
			startPosRef.current = {
				x: e.touches[0].clientX - state.translateX,
				y: e.touches[0].clientY - state.translateY,
			};
		} else if (e.touches.length === 2) {
			setState((prev) => ({ ...prev, isDragging: false }));
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			lastTouchDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
		}
	};

	const handleTouchMove = (e: TouchEvent) => {
		e.preventDefault();
		if (e.touches.length === 1 && state.isDragging && startPosRef.current) {
			const newX = e.touches[0].clientX - startPosRef.current.x;
			const newY = e.touches[0].clientY - startPosRef.current.y;
			updateTransform(state.scale, newX, newY);
		} else if (e.touches.length === 2) {
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (
				lastTouchDistanceRef.current !== null &&
				lastTouchDistanceRef.current > 0
			) {
				const delta = distance / lastTouchDistanceRef.current;
				let newScale = state.scale * delta;
				newScale = Math.max(0.5, Math.min(newScale, 5));
				updateTransform(newScale, state.translateX, state.translateY);
			}
			lastTouchDistanceRef.current = distance;
		}
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Escape" && state.isOpen) {
			closeViewer();
		}
	};

	const handleContentClick = (e: MouseEvent) => {
		if (
			e.target === e.currentTarget ||
			(e.target as HTMLElement).classList.contains("image-viewer-content")
		) {
			closeViewer();
		}
	};

	useEffect(() => {
		if (!state.isOpen) return;

		const content = viewerRef.current?.querySelector(".image-viewer-content");
		if (!content) return;

		const wheelHandler = handleWheel as EventListener;
		const mouseDownHandler = startDrag as EventListener;
		const mouseMoveHandler = drag as EventListener;
		const touchStartHandler = handleTouchStart as EventListener;
		const touchMoveHandler = handleTouchMove as EventListener;

		content.addEventListener("wheel", wheelHandler, { passive: false });
		content.addEventListener("mousedown", mouseDownHandler);
		document.addEventListener("mousemove", mouseMoveHandler);
		document.addEventListener("mouseup", stopDrag);
		content.addEventListener("touchstart", touchStartHandler, {
			passive: false,
		});
		content.addEventListener("touchmove", touchMoveHandler, {
			passive: false,
		});
		content.addEventListener("touchend", stopDrag);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			content.removeEventListener("wheel", wheelHandler);
			content.removeEventListener("mousedown", mouseDownHandler);
			document.removeEventListener("mousemove", mouseMoveHandler);
			document.removeEventListener("mouseup", stopDrag);
			content.removeEventListener("touchstart", touchStartHandler);
			content.removeEventListener("touchmove", touchMoveHandler);
			content.removeEventListener("touchend", stopDrag);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [
		state.isOpen,
		state.isDragging,
		state.scale,
		state.translateX,
		state.translateY,
	]);

	return (
		<>
			<button
				type="button"
				onClick={openViewer}
				style={{
					border: "none",
					background: "none",
					padding: 0,
					cursor: "zoom-in",
					display: "inline-block",
				}}
				aria-label={`Click to zoom ${alt}`}
			>
				<img src={src} alt={alt} class={className} draggable={false} />
			</button>

			{state.isOpen && (
				<div ref={viewerRef} class="image-viewer active">
					<div class="image-viewer-backdrop" />
					<button
						type="button"
						class="image-viewer-close"
						aria-label="Close"
						title="Close (Esc)"
						onClick={closeViewer}
					>
						×
					</button>
					<button
						type="button"
						class="image-viewer-content"
						onClick={handleContentClick}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								handleContentClick(e as unknown as MouseEvent);
							}
						}}
						aria-label="Click to close viewer"
					>
						<img
							ref={imgRef}
							class="image-viewer-img"
							src={src}
							alt={alt}
							draggable={false}
							style={{
								transform: `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`,
								cursor: state.isDragging ? "grabbing" : "grab",
							}}
						/>
					</button>
				</div>
			)}
		</>
	);
};
