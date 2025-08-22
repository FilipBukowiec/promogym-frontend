import { Component, OnInit } from '@angular/core';
import { LoaderComponent } from '../loader/loader.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Sentence } from '../../models/sentence.model';
import { SentencesService } from '../../services/sentences.service';
import { RetryHelperService } from '../../services/retry-helper.service';
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
  sentencesList: Sentence[] = [];
  newSentence: string = '';
  newSentences: string = '';
  editedSentence: string = '';
  editingSentenceId: string | null = null;

  sentences$!: Observable<Sentence[]>;
  sentences: Sentence[] = [];

  error: string | null = null;

  constructor(
    private sentencesService: SentencesService,
    private retryHelper: RetryHelperService
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.sentences$ = this.sentencesService.sentences$;
    this.sentencesService.getAllSentences().subscribe(
    data => {
this.sentences = data
        this.loading = false;
      },
      error => {
        this.loading = false;
        console.error(error)
      },
    );
  }

  
  addNewSentence(): void {
    if (this.newSentence.trim()) {
      this.loading = true;
      this.sentencesService.addNewSentence(this.newSentence).subscribe({
        next: () => {
          this.newSentence = '';
          this.loading = false; // loader wyłączony po zakończeniu
        },
        error: () => {
          this.loading = false;
          // tu można też ustawić komunikat o błędzie
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
    if (!confirm("czy chcesz usunąć")) {
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
    })
  }


  moveUp(id:string):void{
    this.sentencesService.moveUp(id).subscribe({
      next: () => {
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    })
  }

   moveDown(id:string):void{
    this.sentencesService.moveDown(id).subscribe({
      next: () => {
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    })
  }


}
