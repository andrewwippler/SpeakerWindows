import React from 'react';
import { render } from '@testing-library/react';
import { HighlightedText } from '@/pages/search';

describe('HighlightedText - XSS Prevention', () => {
  it('renders malicious script tags in query as escaped text, not HTML elements', () => {
    const { container } = render(
      <HighlightedText text="Normal Title" query='<script>alert("xss")</script>' />
    );

    expect(container.querySelectorAll('script').length).toBe(0);
    expect(container.textContent).toContain('Normal Title');
  });

  it('renders malicious HTML in text content as escaped text', () => {
    const { container } = render(
      <HighlightedText
        text='<img src=x onerror=alert(1)>'
        query="test"
      />
    );

    expect(container.querySelectorAll('img').length).toBe(0);
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('renders XSS payload in both text and query safely', () => {
    const { container } = render(
      <HighlightedText
        text='<script>document.cookie</script>'
        query='<script>alert("xss")</script>'
      />
    );

    expect(container.querySelectorAll('script').length).toBe(0);
    expect(container.textContent).toContain('<script>document.cookie</script>');
  });

  it('correctly highlights matching text without XSS', () => {
    const { container } = render(
      <HighlightedText text="Hello World" query="World" />
    );

    const boldSpans = container.querySelectorAll('.font-bold');
    expect(boldSpans.length).toBe(1);
    expect(boldSpans[0].textContent).toBe('World');
  });

  it('handles regex special characters in query safely', () => {
    const { container } = render(
      <HighlightedText text="Price is $10.00 (USD)" query="$10.00" />
    );

    expect(container.textContent).toContain('$10.00');
    expect(container.querySelectorAll('script').length).toBe(0);
  });
});
