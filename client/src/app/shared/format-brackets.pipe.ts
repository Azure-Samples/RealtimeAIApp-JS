import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'formatBrackets',
  standalone: true
})
export class FormatBracketsPipe implements PipeTransform {
  
  constructor(private sanitizer: DomSanitizer) {}
  
  transform(content: string): SafeHtml {
    if (!content) return '';

    // Data is streamed so we need to handle the case where the content is not a complete {{ ... }} pattern    
    // First handle complete {{ ... }} patterns
    let formattedContent = content.replace(/\{\{([^{}]+)\}\}/g, (match, bracketContent) => {
      // Add a span with a CSS class for the label part (e.g., "English:", "Spanish:")
      const formattedBracketContent = bracketContent.trim().replace(/([A-Za-z]+:)/g, '<span class="language-label">$1</span>');
      return `<div class="highlight">${formattedBracketContent}</div>`;
    });
    
    // Then handle any remaining individual brackets
    // Replace {{ with opening div - include regex to style labels for partial chunks too
    formattedContent = formattedContent.replace(/\{\{([^{}]*)/g, (match, partial) => {
      // If we have partial content after the opening bracket, format any labels in it
      if (partial) {
        const formattedPartial = partial.replace(/([A-Za-z]+:)/g, '<span class="language-label">$1</span>');
        return `<div class="highlight">${formattedPartial}`;
      }
      return '<div class="highlight">';
    });
    
    // Replace }} with closing div
    formattedContent = formattedContent.replace(/\}\}/g, '</div>');
    
    // Sanitize the HTML content to prevent XSS attacks
    return this.sanitizer.bypassSecurityTrustHtml(formattedContent);
  }
}