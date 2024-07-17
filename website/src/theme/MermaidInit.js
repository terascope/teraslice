mermaid.initialize({
    startOnLoad: false,
  });

  document.addEventListener("DOMContentLoaded", () => {
    const updateMermaidTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark-mode');
      mermaid.initialize({
        theme: 'default',
        themeVariables: {
          background: isDarkMode ? getComputedStyle(document.documentElement).getPropertyValue('--mermaid-bg-dark') : getComputedStyle(document.documentElement).getPropertyValue('--mermaid-bg-light'),
        },
      });
      mermaid.contentLoaded();
    };

    updateMermaidTheme();

    const observer = new MutationObserver(updateMermaidTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  });
