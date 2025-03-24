import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TopMenuComponent } from "../top-menu/top-menu.component";

@Component({
  selector: 'app-admin',
  imports: [CommonModule, RouterModule, TopMenuComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {

}
