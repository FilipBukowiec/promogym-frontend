import { Component, OnInit } from '@angular/core';
import { LoaderComponent } from '../loader/loader.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Sentence } from '../../models/sentence.model';
import { SentencesService } from '../../services/sentences.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sentences',
  imports: [LoaderComponent, FormsModule, CommonModule],
  templateUrl: './sentences.component.html',
  styleUrl: './sentences.component.scss',
  standalone: true,
})
export class SentencesComponent implements OnInit {
  addMode: string = '';
  loading: boolean = false;
  newSentence: string = '';
  newSentences: string = '';
  editingSentenceId: string | null = null;

  editedContent: string = '';

  sentences$!: Observable<Sentence[]>;
  sentences: Sentence[] = [];

  constructor(private sentencesService: SentencesService) {}

  ngOnInit(): void {
    this.loading = true;
    this.sentences$ = this.sentencesService.sentences$;
    this.sentencesService.sentences$.subscribe((sentences) => {
      this.sentences = sentences;
    });

    this.sentencesService.getAllSentences().subscribe(
      (data) => {
        this.sentences = data;
        this.loading = false;
      },
      (error) => {
        this.loading = false;
        console.error(error);
      }
    );
  }

  addSentences(): void {
    if (!this.newSentences.trim()) return;
    this.loading = true;

    const contents = this.newSentences
      .split(';')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const dtos = contents.map((content) => ({ content }));

    this.sentencesService.addNewSentences(dtos).subscribe({
      next: () => {
        this.newSentences = '';
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  addNewSentence(): void {
    if (this.newSentence.trim()) {
      this.loading = true;
      this.sentencesService.addNewSentence(this.newSentence).subscribe({
        next: () => {
          this.newSentence = '';
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  deleteSentences(): void {
    if (!confirm('czy chcesz usunąć')) {
      return;
    }

    this.loading = true;
    this.sentencesService.deleteAllSentences().subscribe({
      next: () => {
        this.loading = false;
      },

      error: () => {
        this.loading = false;
      },
    });
  }

  deleteSentence(id: string): void {
    if (!confirm('czy chcesz usunąć')) {
      return;
    }
    this.loading = true;
    this.sentencesService.deleteSentence(id).subscribe({
      next: () => {
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  moveUp(id: string): void {
    this.sentencesService.moveUp(id).subscribe({
      next: () => {
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  moveDown(id: string): void {
    this.sentencesService.moveDown(id).subscribe({
      next: () => {
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  startEditing(sentence: Sentence): void {
    this.editingSentenceId = sentence._id;
    this.editedContent = sentence.content;
  }

  saveChanges(): void {
    if (!this.editingSentenceId || !this.editedContent.trim()) return;

    this.loading = true;
    this.sentencesService
      .updateSentence(this.editingSentenceId, this.editedContent)
      .subscribe({
        next: (updatedSentence) => {
          const updatedSentences = this.sentences.map((s) =>
            s._id === updatedSentence._id ? updatedSentence : s
          );
          this.sentencesService.sentencesSubject.next(updatedSentences);
          this.editingSentenceId = null;
          this.editedContent = '';
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }
}
