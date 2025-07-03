document.addEventListener('DOMContentLoaded', function() {
    let observer = null;
    let isBlurActive = false;
    let animationFrame = null;

    // Debounce function to prevent excessive calls
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Enhanced check for command dialog with better retry logic
    const checkElement = setInterval(() => {
        const commandDialog = document.querySelector(".quick-input-widget");
        if (commandDialog) {
            console.log("✅ Command dialog found, setting up observer...");

            // Apply blur immediately if visible
            const isVisible = commandDialog.offsetParent !== null && commandDialog.style.display !== 'none';
            if (isVisible && !isBlurActive) {
                runMyScript();
            }

            // Enhanced mutation observer with better performance
            observer = new MutationObserver(debounce((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const isHidden = commandDialog.style.display === 'none';
                        const isVisible = commandDialog.offsetParent !== null && commandDialog.style.display !== 'none';

                        if (isHidden && isBlurActive) {
                            // Command palette is hidden, remove our blur
                            handleEscape();
                        } else if (isVisible && !isBlurActive) {
                            // Command palette is visible, add our blur
                            runMyScript();
                        }
                    }
                });
            }, 16)); // ~60fps debounce

            observer.observe(commandDialog, {
                attributes: true,
                attributeFilter: ['style'] // Only watch style changes
            });

            clearInterval(checkElement);
        } else {
            console.log("⏳ Command dialog not found yet. Retrying...");
        }
    }, 300); // Reduced interval for better responsiveness

    // Enhanced keyboard event handling
    document.addEventListener('keydown', function(event) {
        // Command palette shortcuts (Ctrl+Shift+P, Cmd+Shift+P, Ctrl+P, Cmd+P)
        if ((event.metaKey || event.ctrlKey) &&
            (event.key === 'p' || event.key === 'P') &&
            !event.altKey) {

            // Small delay to ensure VS Code has time to show the palette
            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (!isBlurActive) runMyScript();
                }, 50);
            });
        }
    });

    // Global escape handler with better performance
    document.addEventListener('keydown', function(event) {
        if ((event.key === 'Escape' || event.key === 'Esc') && isBlurActive) {
            // Let VS Code handle the first escape to close the command palette
            // We'll handle our blur removal through the mutation observer
            return;
        }
    }, true);

    // Enhanced blur effect with smooth animations
    function runMyScript() {
        if (isBlurActive) return; // Prevent duplicate calls

        const targetDiv = document.querySelector(".monaco-workbench");
        if (!targetDiv) {
            console.warn("Monaco workbench not found");
            return;
        }

        // Remove existing blur element
        const existingElement = document.getElementById("command-blur");
        if (existingElement) {
            existingElement.remove();
        }

        // Create enhanced blur backdrop
        const blurElement = document.createElement("div");
        blurElement.setAttribute('id', 'command-blur');

        // Enhanced click handler with animation
        blurElement.addEventListener('click', function(e) {
            if (e.target === blurElement) { // Only close if clicking the backdrop
                handleEscape();
            }
        });

        // Add smooth entrance animation
        blurElement.style.opacity = '0';
        targetDiv.appendChild(blurElement);

        // Trigger animation after DOM insertion
        requestAnimationFrame(() => {
            blurElement.style.opacity = '1';
        });

        // Hide widgets with smooth animation
        animateWidgets(false);

        isBlurActive = true;
        console.log("🌟 Blur effect activated");
    }

    // Enhanced escape handler with smooth animations
    function handleEscape() {
        if (!isBlurActive) return;

        const blurElement = document.getElementById("command-blur");

        if (blurElement) {
            // Smooth fade out animation
            blurElement.style.opacity = '0';

            // Remove element after animation completes
            setTimeout(() => {
                blurElement.remove();
            }, 200); // Match CSS transition duration
        }

        // Show widgets with smooth animation
        animateWidgets(true);

        isBlurActive = false;
        console.log("✨ Blur effect deactivated");
    }

    // Enhanced widget animation function
    function animateWidgets(show) {
        const widgets = document.querySelectorAll(".sticky-widget");
        const treeWidget = document.querySelector(".monaco-tree-sticky-container");
        const minimap = document.querySelector(".monaco-editor .minimap");
        const scrollbars = document.querySelectorAll(".monaco-scrollable-element > .scrollbar");

        const targetOpacity = show ? '1' : '0';
        const elements = [...widgets];

        if (treeWidget) elements.push(treeWidget);
        if (minimap) elements.push(minimap);
        scrollbars.forEach(scrollbar => elements.push(scrollbar));

        // Cancel any existing animation frame
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }

        // Smooth animation for all elements
        animationFrame = requestAnimationFrame(() => {
            elements.forEach(element => {
                if (element) {
                    element.style.transition = 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
                    element.style.opacity = targetOpacity;
                }
            });
        });
    }

    // Enhanced focus management
    function manageFocus() {
        const commandInput = document.querySelector(".quick-input-filter input");
        if (commandInput && isBlurActive) {
            // Ensure input stays focused
            commandInput.focus();
        }
    }

    // Focus management with debouncing
    const debouncedFocusManager = debounce(manageFocus, 100);

    // Monitor focus changes when blur is active
    document.addEventListener('focusin', function() {
        if (isBlurActive) {
            debouncedFocusManager();
        }
    });

    // Cleanup function for when the page is unloaded
    window.addEventListener('beforeunload', function() {
        if (observer) {
            observer.disconnect();
        }
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
    });

    // Additional enhancement: Handle theme changes
    const themeObserver = new MutationObserver(debounce(() => {
        if (isBlurActive) {
            // Refresh blur effect when theme changes
            const blurElement = document.getElementById("command-blur");
            if (blurElement) {
                // Force redraw to adapt to new theme
                blurElement.style.display = 'none';
                requestAnimationFrame(() => {
                    blurElement.style.display = '';
                });
            }
        }
    }, 300));

    // Watch for theme changes on the body element
    const bodyElement = document.body;
    if (bodyElement) {
        themeObserver.observe(bodyElement, {
            attributes: true,
            attributeFilter: ['class', 'data-theme']
        });
    }

    console.log("🚀 Enhanced VS Code Command Palette script loaded");
});
