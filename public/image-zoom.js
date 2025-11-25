// Lightweight image zoom viewer
(function() {
	'use strict';

	let viewer = null;
	let currentImg = null;
	let scale = 1;
	let translateX = 0;
	let translateY = 0;
	let isDragging = false;
	let startX = 0;
	let startY = 0;

	function createViewer() {
		viewer = document.createElement('div');
		viewer.className = 'image-viewer';
		viewer.innerHTML = `
			<div class="image-viewer-backdrop"></div>
			<button class="image-viewer-close" aria-label="Close" title="Close (Esc)">×</button>
			<div class="image-viewer-content">
				<img class="image-viewer-img" alt="" />
			</div>
		`;
		document.body.appendChild(viewer);

		const closeBtn = viewer.querySelector('.image-viewer-close');
		const content = viewer.querySelector('.image-viewer-content');
		currentImg = viewer.querySelector('.image-viewer-img');

		// Close handlers - click on viewer itself (not content or image)
		viewer.addEventListener('click', (e) => {
			if (e.target === viewer || e.target === content) {
				closeViewer();
			}
		});
		closeBtn.addEventListener('click', closeViewer);
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && viewer.classList.contains('active')) {
				closeViewer();
			}
		});

		// Zoom with mouse wheel
		content.addEventListener('wheel', (e) => {
			e.preventDefault();
			const delta = e.deltaY > 0 ? 0.9 : 1.1;
			scale *= delta;
			scale = Math.max(0.5, Math.min(scale, 5)); // Limit between 0.5x and 5x
			updateTransform();
		}, { passive: false });

		// Pan with mouse drag
		content.addEventListener('mousedown', startDrag);
		document.addEventListener('mousemove', drag);
		document.addEventListener('mouseup', stopDrag);

		// Touch support
		content.addEventListener('touchstart', handleTouchStart, { passive: false });
		content.addEventListener('touchmove', handleTouchMove, { passive: false });
		content.addEventListener('touchend', stopDrag);
	}

	function startDrag(e) {
		if (e.target === currentImg) {
			e.preventDefault(); // Prevent native drag
			isDragging = true;
			startX = e.clientX - translateX;
			startY = e.clientY - translateY;
			currentImg.style.cursor = 'grabbing';
		}
	}

	function drag(e) {
		if (!isDragging) return;
		e.preventDefault();
		translateX = e.clientX - startX;
		translateY = e.clientY - startY;
		updateTransform();
	}

	function stopDrag() {
		isDragging = false;
		if (currentImg) {
			currentImg.style.cursor = 'grab';
		}
	}

	let lastTouchDistance = 0;
	function handleTouchStart(e) {
		if (e.touches.length === 1) {
			isDragging = true;
			startX = e.touches[0].clientX - translateX;
			startY = e.touches[0].clientY - translateY;
		} else if (e.touches.length === 2) {
			isDragging = false;
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
		}
	}

	function handleTouchMove(e) {
		e.preventDefault();
		if (e.touches.length === 1 && isDragging) {
			translateX = e.touches[0].clientX - startX;
			translateY = e.touches[0].clientY - startY;
			updateTransform();
		} else if (e.touches.length === 2) {
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			const distance = Math.sqrt(dx * dx + dy * dy);
			
			if (lastTouchDistance > 0) {
				const delta = distance / lastTouchDistance;
				scale *= delta;
				scale = Math.max(0.5, Math.min(scale, 5));
				updateTransform();
			}
			lastTouchDistance = distance;
		}
	}

	function updateTransform() {
		currentImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
	}

	function openViewer(src, alt) {
		if (!viewer) createViewer();
		
		scale = 1;
		translateX = 0;
		translateY = 0;
		
		currentImg.src = src;
		currentImg.alt = alt;
		currentImg.draggable = false; // Prevent native drag in viewer
		currentImg.style.transform = 'translate(0, 0) scale(1)';
		currentImg.style.cursor = 'grab';
		
		viewer.classList.add('active');
		document.body.style.overflow = 'hidden';
	}

	function closeViewer() {
		if (viewer) {
			viewer.classList.remove('active');
			document.body.style.overflow = '';
			scale = 1;
			translateX = 0;
			translateY = 0;
		}
	}

	// Initialize on DOM ready
	function init() {
		// Find all images in article content and make them clickable
		const images = document.querySelectorAll('article img');
		images.forEach(img => {
			img.style.cursor = 'zoom-in';
			img.draggable = false; // Prevent native image drag
			img.addEventListener('click', () => {
				openViewer(img.src, img.alt);
			});
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
