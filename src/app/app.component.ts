import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { LinkService, ShortLink } from './link.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './snip.component.html',
  styleUrl: './snip.component.css'
})
export class AppComponent implements OnInit {
  private readonly linkService = inject(LinkService);

  readonly links = signal<ShortLink[]>([]);
  readonly urlInput = signal('');
  readonly errorMessage = signal<string | null>(null);
  readonly createdLink = signal<ShortLink | null>(null);
  readonly isSubmitting = signal(false);

  ngOnInit(): void {
    this.loadLinks();
  }

  onUrlInput(event: Event): void {
    this.urlInput.set((event.target as HTMLInputElement).value);
  }

  createLink(): void {
    this.errorMessage.set(null);
    this.createdLink.set(null);

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(this.urlInput().trim());
    } catch {
      this.errorMessage.set('Enter a valid http or https URL.');
      return;
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      this.errorMessage.set('Enter a valid http or https URL.');
      return;
    }

    this.isSubmitting.set(true);
    this.linkService.createLink(parsedUrl.href).subscribe({
      next: (link) => {
        this.links.update((links) => [...links, link]);
        this.createdLink.set(link);
        this.urlInput.set('');
        this.isSubmitting.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.readError(error, 'Could not create the short link.'));
        this.isSubmitting.set(false);
      },
    });
  }

  private loadLinks(): void {
    this.linkService.getLinks().subscribe({
      next: (links) => this.links.set(links),
      error: (error: unknown) => {
        this.errorMessage.set(this.readError(error, 'Could not load links.'));
      },
    });
  }

  private readError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.error === 'string') return error.error.error;
      if (error.status === 0) return 'Cannot reach the Snip API at localhost:3000.';
    }
    return fallback;
  }
}
