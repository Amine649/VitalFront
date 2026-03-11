import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Demande } from '../../models/demande.model';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss'
})
export class ConfirmationComponent implements OnInit {
  demande: any | null = null;

  ngOnInit(): void {
    const demandeData = localStorage.getItem('demande');
    if (demandeData) {
      this.demande = JSON.parse(demandeData);
    }
  }
} 