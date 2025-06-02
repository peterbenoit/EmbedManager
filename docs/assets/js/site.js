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
	if (document.querySelector('.demo-page')) {
		initDemoPage();
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

// Demo page functionality
async function initDemoPage() {
	const embedForm = document.getElementById('embed-form');
	const embedType = document.getElementById('embed-type');
	const embedSrc = document.getElementById('embed-src');
	const embedTitle = document.getElementById('embed-title');
	const embedWidth = document.getElementById('embed-width');
	const embedAspect = document.getElementById('embed-aspect');
	const embedAutoplay = document.getElementById('embed-autoplay');
	const dynamicFields = document.getElementById('dynamic-fields');
	const previewContainer = document.getElementById('embed-preview');
	const codeOutput = document.getElementById('code-output');
	const copyButton = document.getElementById('copy-code');
	const resetButton = document.getElementById('reset-demo');
	const presetButtons = document.querySelectorAll('.preset-btn');

	// Handle form submission
	embedForm.addEventListener('submit', function (e) {
		e.preventDefault();
		generateEmbed();
	});

	// Reset form
	resetButton.addEventListener('click', function () {
		embedForm.reset();
		previewContainer.innerHTML = '<div class="placeholder-message"><p>Your embed will appear here</p></div>';
		codeOutput.textContent = '<!-- Fill out the form to generate your embed code -->';
		Prism.highlightElement(codeOutput);
		dynamicFields.innerHTML = '';
	});

	// Copy code button
	copyButton.addEventListener('click', function () {
		const codeToCopy = codeOutput.textContent;
		navigator.clipboard.writeText(codeToCopy).then(() => {
			const originalText = copyButton.textContent;
			copyButton.textContent = 'Copied!';
			setTimeout(() => {
				copyButton.textContent = originalText;
			}, 2000);
		});
	});

	// Handle embed type changes to show relevant fields
	embedType.addEventListener('change', function () {
		updateDynamicFields(this.value);
	});

	// Handle preset buttons
	presetButtons.forEach(button => {
		button.addEventListener('click', function () {
			const type = this.getAttribute('data-type');
			const src = this.getAttribute('data-src');
			const title = this.getAttribute('data-title');
			const requiresKey = this.getAttribute('data-requires-key') === 'true';

			embedType.value = type;
			embedSrc.value = src;
			embedTitle.value = title || `${type.charAt(0).toUpperCase() + type.slice(1)} Demo`;

			updateDynamicFields(type);

			// For Google Maps, show a message about requiring an API key
			if (type === 'maps' || type === 'google-maps') {
				const apiKeyField = document.getElementById('embed-api-key');
				if (apiKeyField && requiresKey) {
					// Don't auto-generate the embed if it requires a key
					const keyHelp = document.querySelector('#embed-api-key + .help-text');
					if (keyHelp) {
						keyHelp.innerHTML = 'Using a restricted API key protects your quota and prevents unauthorized usage. <a href="https://developers.google.com/maps/documentation/embed/get-api-key" target="_blank">Learn more</a>';
					}
					apiKeyField.required = true;
					apiKeyField.focus();
					return;
				}
			}

			generateEmbed();
		});
	});

	// Try to load API key if available
	const apiKey = await loadApiKey();

	// For Google Maps examples, auto-fill the API key field if available
	if (apiKey) {
		const apiKeyField = document.getElementById('embed-api-key');
		if (apiKeyField) {
			apiKeyField.value = apiKey.trim();
		}
	}

	// Update dynamic fields based on embed type
	function updateDynamicFields(type) {
		dynamicFields.innerHTML = '';

		switch (type) {
			case 'youtube':
				addField('checkbox', 'embed-modest', 'Use modest branding', true);
				break;

			case 'vimeo':
				addField('text', 'embed-hash', 'Privacy Hash (for private videos)');
				break;

			case 'codepen':
				addField('select', 'embed-tab', 'Default Tab', null, [
					{ value: 'result', label: 'Result' },
					{ value: 'html', label: 'HTML' },
					{ value: 'css', label: 'CSS' },
					{ value: 'js', label: 'JavaScript' }
				]);
				addField('checkbox', 'embed-editable', 'Editable');
				break;

			case 'twitter':
			case 'x':
				addField('select', 'embed-theme', 'Theme', null, [
					{ value: 'light', label: 'Light' },
					{ value: 'dark', label: 'Dark' }
				]);
				break;

			case 'soundcloud':
				addField('color', 'embed-color', 'Player Color', '#ff5500');
				addField('checkbox', 'embed-comments', 'Show Comments', true);
				break;

			case 'maps':
			case 'google-maps':
				addField('text', 'embed-api-key', 'Google Maps API Key', '', {
					required: true,
					helpText: '<strong>Required:</strong> Using a domain-restricted API key prevents unauthorized usage and protects your quota. <a href="https://developers.google.com/maps/documentation/embed/get-api-key#restrict_key" target="_blank">Learn more about API key security</a>'
				});
				break;
		}
	}

	// Helper to add dynamic form fields
	function addField(type, id, label, defaultValue = null, options = {}) {
		const fieldContainer = document.createElement('div');
		fieldContainer.className = type === 'checkbox' ? 'form-group checkbox' : 'form-group';

		if (type === 'checkbox') {
			const input = document.createElement('input');
			input.type = 'checkbox';
			input.id = id;
			input.name = id;
			if (defaultValue) input.checked = true;

			const labelElement = document.createElement('label');
			labelElement.htmlFor = id;
			labelElement.textContent = label;

			fieldContainer.appendChild(input);
			fieldContainer.appendChild(labelElement);
		}
		else if (type === 'select') {
			const labelElement = document.createElement('label');
			labelElement.htmlFor = id;
			labelElement.textContent = label;

			const select = document.createElement('select');
			select.id = id;
			select.name = id;

			options.forEach(option => {
				const optElement = document.createElement('option');
				optElement.value = option.value;
				optElement.textContent = option.label;
				if (defaultValue === option.value) optElement.selected = true;
				select.appendChild(optElement);
			});

			fieldContainer.appendChild(labelElement);
			fieldContainer.appendChild(select);
		}
		else {
			const labelElement = document.createElement('label');
			labelElement.htmlFor = id;
			labelElement.textContent = label;

			const input = document.createElement('input');
			input.type = type;
			input.id = id;
			input.name = id;
			if (defaultValue) input.value = defaultValue;
			if (options.required) input.required = true;

			fieldContainer.appendChild(labelElement);
			fieldContainer.appendChild(input);

			// Add help text if provided
			if (options.helpText) {
				const helpText = document.createElement('small');
				helpText.className = 'help-text';
				helpText.innerHTML = options.helpText;
				fieldContainer.appendChild(helpText);
			}
		}

		dynamicFields.appendChild(fieldContainer);
	}

	// Load Google Maps API key from file if available
	async function loadApiKey() {
		try {
			const response = await fetch('/api.key');
			if (response.ok) {
				return await response.text();
			}
		} catch (e) {
			console.log('No API key file available');
		}
		return '';
	}

	// Generate embed
	function generateEmbed() {
		const type = embedType.value;
		const src = embedSrc.value;
		const title = embedTitle.value || 'Embedded content';
		const width = embedWidth.value || '100%';
		const aspectRatio = embedAspect.value;
		const autoplay = embedAutoplay.checked;

		if (!type || !src) {
			alert('Please select an embed type and provide a source URL.');
			return;
		}

		// Build attributes string
		let attributes = `data-type="${type}"
     data-src="${src}"
     data-title="${title}"
     data-aspect-ratio="${aspectRatio}"`;

		if (autoplay) {
			attributes += `\n     data-autoplay="true"`;
		}

		// Add type-specific attributes
		switch (type) {
			case 'codepen':
				const tab = document.getElementById('embed-tab')?.value;
				const editable = document.getElementById('embed-editable')?.checked;
				if (tab) attributes += `\n     data-default-tab="${tab}"`;
				if (editable) attributes += `\n     data-editable="true"`;
				break;

			case 'vimeo':
				const hash = document.getElementById('embed-hash')?.value;
				if (hash) attributes += `\n     data-hash="${hash}"`;
				break;

			case 'twitter':
			case 'x':
				const theme = document.getElementById('embed-theme')?.value;
				if (theme) attributes += `\n     data-theme="${theme}"`;
				break;

			case 'soundcloud':
				const color = document.getElementById('embed-color')?.value;
				const comments = document.getElementById('embed-comments')?.checked;
				if (color) attributes += `\n     data-color="${color.replace('#', '')}"`;
				if (!comments) attributes += `\n     data-show-comments="false"`;
				break;

			case 'maps':
			case 'google-maps':
				const apiKey = document.getElementById('embed-api-key')?.value;
				if (!apiKey) {
					alert('A Google Maps API key is required.');
					return;
				}
				attributes += `\n     data-api-key="${apiKey}"`;
				break;
		}

		// Generate HTML
		const embedHTML = `<div class="embed-container" ${attributes}>
</div>`;

		// Update code display
		codeOutput.textContent = embedHTML;
		Prism.highlightElement(codeOutput);

		// Clear and update preview
		previewContainer.innerHTML = '';

		// Create embed container
		const container = document.createElement('div');
		container.className = 'embed-container';
		container.setAttribute('data-type', type);
		container.setAttribute('data-src', src);
		container.setAttribute('data-title', title);
		container.setAttribute('data-aspect-ratio', aspectRatio);

		if (autoplay) {
			container.setAttribute('data-autoplay', 'true');
		}

		// Add type-specific attributes to the container
		switch (type) {
			case 'codepen':
				const tab = document.getElementById('embed-tab')?.value;
				const editable = document.getElementById('embed-editable')?.checked;
				if (tab) container.setAttribute('data-default-tab', tab);
				if (editable) container.setAttribute('data-editable', 'true');
				break;

			case 'vimeo':
				const hash = document.getElementById('embed-hash')?.value;
				if (hash) container.setAttribute('data-hash', hash);
				break;

			case 'twitter':
			case 'x':
				const theme = document.getElementById('embed-theme')?.value;
				if (theme) container.setAttribute('data-theme', theme);
				break;

			case 'soundcloud':
				const color = document.getElementById('embed-color')?.value;
				const comments = document.getElementById('embed-comments')?.checked;
				if (color) container.setAttribute('data-color', color.replace('#', ''));
				if (!comments) container.setAttribute('data-show-comments', 'false');
				break;

			case 'maps':
			case 'google-maps':
				const apiKey = document.getElementById('embed-api-key')?.value;
				if (apiKey) container.setAttribute('data-api-key', apiKey);
				break;
		}

		previewContainer.appendChild(container);

		// Process with EmbedManager
		if (window.EmbedManager) {
			window.EmbedManager.processContainer(container);
		}
	}
}
