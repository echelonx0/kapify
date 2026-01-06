import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ArrowRight, Folder, Shield } from 'lucide-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-kapify-hero',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './kapify-hero.component.html',
  styleUrl: './kapify-hero.component.css',
})
export class KapifyHeroComponent {
  // Icons
  ArrowRightIcon = ArrowRight;
  FolderIcon = Folder;
  ShieldIcon = Shield;

  constructor(private router: Router) {}

  startFunding() {
    this.router.navigate(['/register']);
  }

  viewProcess() {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
