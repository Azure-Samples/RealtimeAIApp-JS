import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: '/language-coach', pathMatch: 'full' },
    { 
        path: 'language-coach', 
        loadComponent: () => import('./language-coach/language-coach.component')
            .then(m => m.LanguageCoachComponent) 
    },
    { 
        path: 'medical-form', 
        loadComponent: () => import('./medical-form/medical-form.component')
            .then(m => m.MedicalFormComponent) 
    },
    { path: '**', redirectTo: '/language-coach', pathMatch: 'full' }
];
