/**
 * Site.js - JavaScript for EmbedManager documentation site
 */

document.addEventListener('DOMContentLoaded', function () {
	// Set current year in footer
	const yearElement = document.getElementById('current-year');
	if (yearElement) {
		yearElement.textContent = new Date().getFullYear();
	}

	// Mobile menu toggle
	const menuToggle = document.getElementById('menu-toggle');
	const mainMenu = document.getElementById('main-menu');

	if (menuToggle && mainMenu) {
		menuToggle.addEventListener('click', function () {
			mainMenu.classList.toggle('active');
			menuToggle.classList.toggle('active');
		});
	}

	// Smooth scrolling for anchor links in documentation
	document.querySelectorAll('.doc-nav a[href^="#"]').forEach(anchor => {
		anchor.addEventListener('click', function (e) {
			e.preventDefault();

			const targetId = this.getAttribute('href');
			const targetElement = document.querySelector(targetId);

			if (targetElement) {
				window.scrollTo({
					top: targetElement.offsetTop - 80, // Account for header
					behavior: 'smooth'
				});

				// Update URL hash without scrolling
				history.pushState(null, null, targetId);
			}
		});
	});

	// Highlight current section in sidebar
	const observeDocSections = () => {
		const sections = document.querySelectorAll('.doc-content section[id]');
		if (sections.length === 0) return;

		const observer = new IntersectionObserver(entries => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					const id = entry.target.getAttribute('id');
					document.querySelectorAll('.doc-nav a').forEach(link => {
						link.classList.remove('active');
					});
					document.querySelector(`.doc-nav a[href="#${id}"]`)?.classList.add('active');
				}
			});
		}, { rootMargin: '-100px 0px -80% 0px' });

		sections.forEach(section => {
			observer.observe(section);
		});
	};

	// Run on documentation pages
	if (document.querySelector('.doc-container')) {
		observeDocSections();
	}

	// Initialize code highlighting if Prism is available
	if (typeof Prism !== 'undefined') {
		Prism.highlightAll();
	}

	// Demo page functionality - if on demo page
	const demoForm = document.getElementById('demo-form');
	if (demoForm) {
		demoForm.addEventListener('submit', function (e) {
			e.preventDefault();
			generateEmbed();
		});
	}

	// Example page code copy buttons
	const copyButtons = document.querySelectorAll('.copy-button');
	copyButtons.forEach(button => {
		button.addEventListener('click', function () {
			const codeBlock = this.closest('.code-container').querySelector('code');
			const textToCopy = codeBlock.textContent;

			navigator.clipboard.writeText(textToCopy).then(() => {
				// Change button text temporarily
				const originalText = this.textContent;
				this.textContent = 'Copied!';
				setTimeout(() => {
					this.textContent = originalText;
				}, 2000);
			}).catch(err => {
				console.error('Failed to copy code: ', err);
			});
		});
	});
});

// Function for demo page to generate embed code
function generateEmbed() {
	const embedType = document.getElementById('embed-type').value;
	const embedUrl = document.getElementById('embed-url').value;
	const embedTitle = document.getElementById('embed-title').value || 'Embedded content';
	const aspectRatio = document.getElementById('aspect-ratio').value;

	if (!embedUrl || !embedType) {
		alert('Please enter a URL and select an embed type');
		return;
	}

	// Generate HTML code
	const embedCode = `<div class="embed-container"
     data-type="${embedType}"
     data-src="${embedUrl}"
     data-title="${embedTitle}"
     data-aspect-ratio="${aspectRatio}">
</div>`;

	// Display code in the demo-code section
	const codeElement = document.getElementById('generated-code');
	if (codeElement) {
		codeElement.textContent = embedCode;

		// Update Prism highlighting
		if (typeof Prism !== 'undefined') {
			Prism.highlightElement(codeElement);
		}
	}

	// Show the preview
	const previewContainer = document.getElementById('embed-preview');
	if (previewContainer) {
		previewContainer.innerHTML = '';

		const container = document.createElement('div');
		container.className = 'embed-container';
		container.setAttribute('data-type', embedType);
		container.setAttribute('data-src', embedUrl);
		container.setAttribute('data-title', embedTitle);
		container.setAttribute('data-aspect-ratio', aspectRatio);

		previewContainer.appendChild(container);

		// Process the container with EmbedManager
		if (window.EmbedManager) {
			window.EmbedManager.processContainer(container);
		}
	}
}
